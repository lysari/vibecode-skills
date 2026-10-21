# Firebase Rules

Apply these on top of the generic rules when the project root has a `firebase.json`.

## Firestore types
- Type a date field `Timestamp` in the interface for data read from Firestore, and `FieldValue | Date` in the interface for data written to it, e.g. `createdAt: Timestamp` in `Order` and `createdAt: FieldValue | Date` in `OrderForm`. Never write `Timestamp | FieldValue | Date` on one field.
