
import os
import random
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers
import re
# -------------------------
# Configuración fija
# -------------------------
SEED = 42
T = 24
EMBED_DIM = 64
RNN_UNITS = 128
BATCH_SIZE = 128
EPOCHS = 5
GENERATE_PER_SETTING = 30
TOP_N = 10
DEVICE = "/cpu:0"
RAW_URL = "https://raw.githubusercontent.com/jpospinalo/MachineLearning/main/nlp/dinos.csv"
LOCAL_PATH = "./data/dinos.csv"
SOS = "<sos>"
EOS = "<eos>"
PAD = "<pad>"

random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)


def load_names(local_path=LOCAL_PATH, raw_url=RAW_URL):
    if os.path.exists(local_path):
        df = pd.read_csv(local_path, header=None)
    else:
        df = pd.read_csv(raw_url, header=None)
    names = df.iloc[:, 0].astype(str).tolist()
    return [n.strip() for n in names if n.strip()]


def normalize_and_tokenize(names, T):
    seqs = []
    for n in names:
        n_norm = n.lower().strip()
        tokens = [SOS] + list(n_norm) + [EOS]
        if len(tokens) > T:
            tokens = tokens[:T]
            tokens[-1] = EOS
        seqs.append(tokens)
    vocab = [PAD]
    for s in seqs:
        for c in s:
            if c not in vocab:
                vocab.append(c)
    return seqs, vocab


def make_mappings(vocab):
    char2idx = {c: i for i, c in enumerate(vocab)}
    idx2char = {i: c for c, i in char2idx.items()}
    return char2idx, idx2char


def make_xy(seqs, char2idx, T):
    N = len(seqs)
    X = np.full((N, T), char2idx[PAD], dtype=np.int32)
    Y = np.full((N, T), char2idx[PAD], dtype=np.int32)
    for i, s in enumerate(seqs):
        for t in range(min(len(s), T)):
            X[i, t] = char2idx[s[t]]
        for t in range(min(len(s)-1, T)):
            Y[i, t] = char2idx[s[t+1]]
    return X, Y


def build_model(vocab_size, embed_dim=EMBED_DIM, rnn_units=RNN_UNITS):
    inputs = layers.Input(shape=(None,), dtype="int32")
    x = layers.Embedding(vocab_size, embed_dim, mask_zero=True)(inputs)
    x = layers.LSTM(rnn_units, return_sequences=True)(x)
    logits = layers.Dense(vocab_size)(x)
    model = tf.keras.Model(inputs, logits)
    model.compile(
        optimizer="adam",
        loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
    )
    return model


def _softmax(logits):
    exp = np.exp(logits - np.max(logits))
    return exp / exp.sum()


def sample_token(logits, temperature=1.0, top_k=0, top_p=0.0):
    l = logits.copy()
    if top_k > 0 and top_k < len(l):
        idxs = np.argpartition(-l, top_k-1)[:top_k]
        mask = np.full_like(l, -1e10)
        mask[idxs] = l[idxs]
        l = mask
    if 0.0 < top_p < 1.0:
        sorted_idx = np.argsort(-l)
        sorted_logits = l[sorted_idx]
        probs = _softmax(sorted_logits)
        cumsum = np.cumsum(probs)
        keep = cumsum <= top_p
        if not keep.any():
            keep[0] = True
        keep_idx = sorted_idx[keep]
        mask = np.full_like(l, -1e10)
        mask[keep_idx] = l[keep_idx]
        l = mask
    if temperature > 0:
        l = l / temperature
    probs = _softmax(l)
    return int(np.random.choice(len(probs), p=probs))


def generate_one(model, char2idx, idx2char, T, temperature, top_k, top_p):
    sos_idx = char2idx[SOS]
    eos_idx = char2idx[EOS]
    cur = [sos_idx]
    for _ in range(T):
        x = np.array(cur)[None, :]
        logits = model.predict(x, verbose=0)[0, -1]
        nxt = sample_token(logits, temperature, top_k, top_p)
        cur.append(nxt)
        if nxt == eos_idx:
            break
    chars = [idx2char[i] for i in cur if i in idx2char]
    name = "".join([c for c in chars if c not in {SOS, EOS, PAD}])
    return name.capitalize()


def score_name(name, originals):
    if not name:
        return -1e6
    n = name.lower()
    if n in originals:
        return -1000
    if any(not c.isalpha() for c in n):
        return -500

    # --- Penalización base por longitud y proporción de vocales ---
    length_score = -abs(len(n) - 8)
    vowels = set("aeiou")
    vf = sum(1 for c in n if c in vowels) / max(1, len(n))
    score = 10 + length_score + 5 * vf

    # --- Penalización por vocal repetida (aaa, eee, etc.) ---
    if re.search(r"(a{2,}|e{2,}|i{2,}|o{2,}|u{2,})", n):
        score -= 500  # penalización fuerte
        print(f"penalizacion: {score}")

    # --- Penalización por secuencias de 3 o más vocales consecutivas (aei, aio, oeu, etc.) ---
    if re.search(r"[aeiou]{3,}", n):
        score -= 500  # penalización adicional

    return score


def train_and_generate(names):
    seqs, vocab = normalize_and_tokenize(names, T)
    char2idx, idx2char = make_mappings(vocab)
    X, Y = make_xy(seqs, char2idx, T)
    ds = tf.data.Dataset.from_tensor_slices((X, Y)).shuffle(len(X), seed=SEED).batch(BATCH_SIZE)

    with tf.device(DEVICE):
        model = build_model(len(vocab))

    if EPOCHS > 0:
        model.fit(ds, epochs=EPOCHS, verbose=1)

    temps = [0.7, 1.0, 2.5, 4.0]
    ks = [0, 5, 10]
    ps = [0.0, 0.8, 0.95]

    originals = set(n.lower() for n in names)
    gens = []  # Ahora guarda tuplas (nombre, temp, k, p)
    for t in temps:
        for k in ks:
            for p in ps:
                for _ in range(GENERATE_PER_SETTING):
                    g = generate_one(model, char2idx, idx2char, T, t, k, p)
                    if g:
                        gens.append((g, t, k, p))

    scored = []
    seen = set()
    for (g, t, k, p) in gens:
        low = g.lower()
        if low not in seen:
            seen.add(low)
            sc = score_name(g, originals)
            scored.append((sc, g, t, k, p))

    scored.sort(key=lambda x: -x[0])
    # Retorno: mejores nombres + modelo + mappings
    return scored[:TOP_N], model, char2idx, idx2char


def main():
    names = load_names()
    print(f"Cargados {len(names)} nombres.")
    top_scored, model, char2idx, idx2char = train_and_generate(names)

    print("\n=== Mejores nombres generados ===")
    for i, (sc, n, t, k, p) in enumerate(top_scored, 1):
        print(f"{i}. {n} --> temp={t}, top-k={k}, top-p={p}")

    # Ahora 'model', 'char2idx', 'idx2char' quedan disponibles en memoria
    return model, char2idx, idx2char



if __name__ == "__main__":
    main()