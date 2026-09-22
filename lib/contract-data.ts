import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { requireFirebase } from "./firebase";
import {
  contractInput,
  assertContractUnchanged,
  validateContract,
  validateContractEdit,
  type ContractInput,
} from "./contracts";
import type { Contract } from "./types";

export async function updateContract(original: Contract, input: ContractInput) {
  validateContractEdit(original, input);
  const { db } = requireFirebase();
  const reference = doc(db, "contracts", original.id);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("This contract no longer exists.");
    assertContractUnchanged(
      contractInput(original),
      contractInput(snapshot.data() as Contract),
    );
    if (input.extendsContractId) {
      const parent = await transaction.get(
        doc(db, "contracts", input.extendsContractId),
      );
      if (
        !parent.exists() ||
        parent.data().businessId !== input.businessId ||
        parent.data().clientId !== input.clientId ||
        input.startDate <= parent.data().endDate
      ) {
        throw new Error(
          "An extension must start after its original contract ends.",
        );
      }
    }
    transaction.update(reference, { ...input });
  });
}

export async function createContract(input: ContractInput) {
  validateContract(input);
  const { db } = requireFirebase();
  const reference = doc(collection(db, "contracts"));
  await runTransaction(db, async (transaction) => {
    const client = await transaction.get(doc(db, "clients", input.clientId));
    if (!client.exists() || client.data().businessId !== input.businessId)
      throw new Error("Choose a client from this business.");
    if (input.extendsContractId) {
      const parent = await transaction.get(
        doc(db, "contracts", input.extendsContractId),
      );
      if (
        !parent.exists() ||
        parent.data().businessId !== input.businessId ||
        parent.data().clientId !== input.clientId
      )
        throw new Error("The original contract is unavailable.");
      if (input.startDate <= parent.data().endDate)
        throw new Error(
          "An extension must start after the original contract ends.",
        );
    }
    transaction.set(reference, {
      ...input,
      id: reference.id,
      createdAt: serverTimestamp(),
    });
  });
  return reference.id;
}
