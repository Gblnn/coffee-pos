import { db } from "@/config/firebase";
import { CreditTransaction, Payment } from "@/types/pos";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";

const CREDIT_COLLECTION = "credit_transactions";

// Create a new credit transaction
export const createCreditTransaction = async (
  transaction: Omit<
    CreditTransaction,
    "id" | "payments" | "paidAmount" | "status"
  >
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, CREDIT_COLLECTION), {
      ...transaction,
      paidAmount: 0,
      status: "pending",
      payments: [],
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating credit transaction:", error);
    throw error;
  }
};

// Get all credit transactions
export const getAllCreditTransactions = async (): Promise<
  CreditTransaction[]
> => {
  try {
    const q = query(collection(db, CREDIT_COLLECTION), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CreditTransaction[];
  } catch (error) {
    console.error("Error getting credit transactions:", error);
    throw error;
  }
};

// Record a payment for a credit transaction
export const recordPayment = async (
  transactionId: string,
  payment: Omit<Payment, "id">
): Promise<void> => {
  try {
    const docRef = doc(db, CREDIT_COLLECTION, transactionId);
    const newPayment = {
      ...payment,
      id: Date.now().toString(),
    };

    // Get the current transaction to calculate new values
    const transaction = (
      await getDocs(
        query(
          collection(db, CREDIT_COLLECTION),
          where("id", "==", transactionId)
        )
      )
    ).docs[0].data() as CreditTransaction;

    const newPaidAmount = transaction.paidAmount + payment.amount;
    const newRemainingAmount = transaction.totalAmount - newPaidAmount;
    const newStatus =
      newRemainingAmount <= 0
        ? "paid"
        : newPaidAmount > 0
        ? "partially_paid"
        : "pending";

    await updateDoc(docRef, {
      payments: [...transaction.payments, newPayment],
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    throw error;
  }
};
