require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Expense = require('./models/Expense');
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  
  const sam = await User.findOne({ email: 'sam@test.com' });
  console.log('Sam found:', sam?.email);

  await Expense.deleteMany({ userId: sam._id });
  console.log('Cleared old expenses');

  const expenses = [
    { title: 'Grocery run', category: 'Food', amount: 94.20, date: new Date('2026-05-20'), paymentMethod: 'Debit Card', description: 'Weekly groceries' },
    { title: 'Uber to airport', category: 'Transport', amount: 34.50, date: new Date('2026-05-19'), paymentMethod: 'Digital Wallet', description: '' },
    { title: 'ASOS order', category: 'Shopping', amount: 127.99, date: new Date('2026-05-17'), paymentMethod: 'Credit Card', description: 'Summer clothes' },
    { title: 'Electricity bill', category: 'Bills', amount: 210.00, date: new Date('2026-05-15'), paymentMethod: 'Bank Transfer', description: 'May electricity' },
    { title: 'Netflix', category: 'Entertainment', amount: 22.99, date: new Date('2026-05-14'), paymentMethod: 'Credit Card', description: 'Monthly subscription' },
    { title: 'Chemist Warehouse', category: 'Health', amount: 45.60, date: new Date('2026-05-13'), paymentMethod: 'Debit Card', description: 'Vitamins' },
    { title: 'Coffee shop', category: 'Food', amount: 18.50, date: new Date('2026-05-12'), paymentMethod: 'Cash', description: 'Morning coffee' },
    { title: 'Gym membership', category: 'Health', amount: 59.99, date: new Date('2026-05-10'), paymentMethod: 'Debit Card', description: 'Monthly gym' },
    { title: 'Spotify', category: 'Entertainment', amount: 11.99, date: new Date('2026-05-09'), paymentMethod: 'Credit Card', description: 'Music subscription' },
    { title: 'Petrol', category: 'Transport', amount: 82.00, date: new Date('2026-05-08'), paymentMethod: 'Debit Card', description: 'Full tank' },
    { title: 'Internet bill', category: 'Bills', amount: 89.00, date: new Date('2026-05-07'), paymentMethod: 'Bank Transfer', description: 'Monthly internet' },
    { title: 'Dinner out', category: 'Food', amount: 67.80, date: new Date('2026-05-06'), paymentMethod: 'Credit Card', description: 'Restaurant with friends' },
    { title: 'Amazon order', category: 'Shopping', amount: 156.30, date: new Date('2026-04-28'), paymentMethod: 'Credit Card', description: 'Home essentials' },
    { title: 'Grocery run', category: 'Food', amount: 88.40, date: new Date('2026-04-25'), paymentMethod: 'Debit Card', description: 'Weekly groceries' },
    { title: 'Bus pass', category: 'Transport', amount: 45.00, date: new Date('2026-04-20'), paymentMethod: 'Digital Wallet', description: 'Monthly bus pass' },
    { title: 'Water bill', category: 'Bills', amount: 65.00, date: new Date('2026-04-15'), paymentMethod: 'Bank Transfer', description: 'Quarterly water' },
    { title: 'Movie tickets', category: 'Entertainment', amount: 38.00, date: new Date('2026-04-10'), paymentMethod: 'Credit Card', description: 'Cinema with friends' },
    { title: 'Pharmacy', category: 'Health', amount: 32.50, date: new Date('2026-04-05'), paymentMethod: 'Cash', description: 'Cold medicine' },
    { title: 'Takeaway', category: 'Food', amount: 42.00, date: new Date('2026-03-28'), paymentMethod: 'Digital Wallet', description: 'Late night pizza' },
    { title: 'Nike shoes', category: 'Shopping', amount: 189.99, date: new Date('2026-03-20'), paymentMethod: 'Credit Card', description: 'Running shoes' },
  ];

  await Expense.insertMany(expenses.map(e => ({ ...e, userId: sam._id })));
  console.log('Added', expenses.length, 'expenses!');

  const existing = await User.findOne({ email: 'admin@test.com' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Vault Admin', email: 'admin@test.com', passwordHash, role: 'admin' });
    console.log('Created admin@test.com / admin123');
  }

  process.exit();
});