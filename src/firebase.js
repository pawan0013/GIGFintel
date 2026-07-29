import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, limit, where, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyDFa7bPu1rsz12_3yNuINrdBwASouxhobo",
  authDomain:        "blackfin-intel.firebaseapp.com",
  projectId:         "blackfin-intel",
  storageBucket:     "blackfin-intel.firebasestorage.app",
  messagingSenderId: "23277243169",
  appId:             "1:23277243169:web:a54ae989b94ba932ea8c60",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)

export const googleProvider = new GoogleAuthProvider()
// Gmail read scope — used by Inbox + Calendar OAuth
// Gmail scope only requested when user explicitly connects Inbox tab
// Calendar read scope — used by Calendar tab
// Calendar scope only requested when user explicitly connects Calendar tab

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const signOutUser      = () => signOut(auth)

// ─── Firestore helpers ────────────────────────────────────────────────────────

export const saveUser = async (user, role = 'analyst') => {
  const ref = doc(db, 'users', user.uid)
  const existing = await getDoc(ref)
  if (!existing.exists()) {
    await setDoc(ref, { uid: user.uid, email: user.email, name: user.displayName, photo: user.photoURL, role, createdAt: new Date().toISOString() })
  }
  return (await getDoc(ref)).data()
}

export const getUserRole = async (uid) => {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data().role : 'analyst'
}

export const saveDeal = async (uid, deal) => {
  return addDoc(collection(db, 'deals'), {
    ...deal, uid, createdAt: new Date().toISOString(), id: Date.now().toString()
  })
}

export const getDeals = async (uid) => {
  try {
    const q = query(collection(db, 'deals'), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(100))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ ...d.data(), docId: d.id }))
  } catch (e) {
    console.error('getDeals error:', e)
    return []
  }
}

export const getSimilarDeals = async (uid, sector, excludeCompany) => {
  const q = query(collection(db, 'deals'), where('uid', '==', uid), where('sector', '==', sector), limit(5))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data()).filter(d => d.company !== excludeCompany)
}

export const updateDealStatus = async (docId, status, notes) => {
  await updateDoc(doc(db, 'deals', docId), { humanStatus: status, notes, updatedAt: new Date().toISOString() })
}

export const saveMessage = async (uid, role, content) => {
  return addDoc(collection(db, 'messages'), { uid, role, content, ts: new Date().toISOString() })
}

export const getMessages = async (uid) => {
  const q = query(collection(db, 'messages'), where('uid', '==', uid), orderBy('ts', 'asc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}
