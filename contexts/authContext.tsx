// Update the path below if your firebase config is in a different location
import { AuthContextType, UserType } from "@/types";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { createContext, useState } from "react";
import { auth, firestore } from "../config/firebaseConfig";
import { setDoc, doc, getDoc } from "firebase/firestore";

const authContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      return { success: false, msg };
    }
  };
};
    

const register = async (email: string, password: string, name: string) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        name,
        email,
        uid: response?.user?.uid,
      });
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      return { success: false, msg };
    }
  };

  const updateUserData = async (uid: string) => {
  try {
    const docRef = doc(firestore, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const userData: UserType = {
        uid: data?.uid,
        email: data.email || null,
        name: data.name || null,
        image: data.image || null,
      };
      setUser({ ...userData });
    }
  } catch (error: any) {
    let msg = error.message;
    // return { success: false, msg };
    console.log("error: ", error);
  }
};

const contextValue: AuthContextType = {
user,
setUser,
login,
register,
updateUserData
};

return (
<AuthContext.Provider value={contextValue}>
    {children}
</AuthContext.Provider>
);


