// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import 'server-only';
import { adminFirestore } from './server';
import { Timestamp } from 'firebase-admin/firestore';

const CUSTOMERS = [
    { id: 'CUST-001', name: 'Innovate Inc.', email: 'contact@innovate.com', company: 'Innovate Inc.', phone: '123-456-7890', status: 'active', dateAdded: '2023-01-15' },
    { id: 'CUST-002', name: 'Solutions LLC', email: 'support@solutions.io', company: 'Solutions LLC', phone: '234-567-8901', status: 'active', dateAdded: '2023-02-20' },
    { id: 'CUST-003', name: 'Quantum Corp', email: 'admin@quantum.co', company: 'Quantum Corp', phone: '345-678-9012', status: 'inactive', dateAdded: '2023-03-10' },
];

function generateRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function collectionExists(collectionPath: string) {
    const snapshot = await adminFirestore.collection(collectionPath).limit(1).get();
    return !snapshot.empty;
}

export async function seedDatabase() {
    console.log("Checking if seeding is necessary...");

    const customersExist = await collectionExists('customers');
    const ordersExist = await collectionExists('orders');
    
    if (customersExist && ordersExist) {
        console.log("Database already contains data. Seeding skipped.");
        return { success: true, message: "Database already seeded." };
    }
    
    console.log("Seeding database with initial data...");

    const batch = adminFirestore.batch();

    // Seed Customers if they don't exist
    if (!customersExist) {
        console.log("Seeding customers...");
        CUSTOMERS.forEach(customer => {
            const docRef = adminFirestore.collection('customers').doc(customer.id);
            batch.set(docRef, customer);
        });
    }

    // Seed Orders if they don't exist
    if (!ordersExist) {
        console.log("Seeding orders...");
        const startDate = new Date(2023, 0, 1); // Start of 2023
        const endDate = new Date(); // Today

        for (let i = 0; i < 50; i++) { // Create 50 random orders
            const randomCustomer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
            const randomDate = generateRandomDate(startDate, endDate);
            const totalAmount = Math.floor(Math.random() * (20000 - 500 + 1)) + 500; // Random amount between 500 and 20000

            const orderRef = adminFirestore.collection('orders').doc(); // Auto-generate ID
            batch.set(orderRef, {
                customerId: randomCustomer.id,
                orderDate: Timestamp.fromDate(randomDate),
                totalAmount: totalAmount,
                status: 'Completed',
                orderLineItemIds: []
            });
        }
    }

    try {
        await batch.commit();
        console.log("Database seeded successfully.");
        return { success: true, message: "Database seeded successfully." };
    } catch (error) {
        console.error("Error seeding database:", error);
        return { success: false, message: "Error seeding database." };
    }
}
