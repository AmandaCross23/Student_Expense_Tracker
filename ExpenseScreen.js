import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export default function ExpenseScreen() {
  const db = useSQLiteContext();

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState("all");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const loadExpenses = async () => {
    let query = "SELECT * FROM expenses";
    let params = [];

    if (filter === "week") {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const startString = weekStart.toISOString().split("T")[0];

      query += " WHERE date >= ?";
      params.push(startString);
    }

    if (filter === "month") {
      const today = new Date();
      const monthStart = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-01`;

      query += " WHERE date >= ?";
      params.push(monthStart);
    }

    query += " ORDER BY id DESC;";

    const rows = await db.getAllAsync(query, params);
    setExpenses(rows);
  };

  const addExpense = async () => {
    const amountNumber = parseFloat(amount);

    if (isNaN(amountNumber) || amountNumber <= 0 || category.trim() === "") {
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    await db.runAsync(
      `INSERT INTO expenses (amount, category, note, date)
       VALUES (?, ?, ?, ?);`,
      [amountNumber, category.trim(), note.trim() || null, today]
    );

    setAmount('');
    setCategory('');
    setNote('');

    loadExpenses();
  };

  const deleteExpense = async (id) => {
    await db.runAsync("DELETE FROM expenses WHERE id = ?;", [id]);
    loadExpenses();
  };

  const startEditing = (item) => {
    setEditItem(item);
    setEditAmount(String(item.amount));
    setEditCategory(item.category);
    setEditNote(item.note || "");
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    await db.runAsync(
      `UPDATE expenses
       SET amount = ?, category = ?, note = ?
       WHERE id = ?;`,
      [
        parseFloat(editAmount),
        editCategory.trim(),
        editNote.trim() || null,
        editItem.id,
      ]
    );

    setEditModalVisible(false);
    loadExpenses();
  };

  useEffect(() => {
    async function setup() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL
        );
      `);

      await loadExpenses();
    }

    setup();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [filter]);

  const renderExpense = ({ item }) => (
    <View style={styles.expenseRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
        <Text style={styles.expenseDate}>{item.date}</Text>
      </View>

      <TouchableOpacity onPress={() => startEditing(item)}>
        <Text style={styles.edit}>✎</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteExpense(item.id)}>
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Expense Tracker</Text>
      <View style={styles.filters}>
        <Button title="All" onPress={() => setFilter("all")} />
        <Button title="This Week" onPress={() => setFilter("week")} />
        <Button title="This Month" onPress={() => setFilter("month")} />
      </View>
      <Text style={styles.totalText}>Total Spent: ${totalSpent.toFixed(2)}</Text>
      <View style={styles.categoryTotalsBox}>
        <Text style={styles.sectionTitle}>Totals by Category:</Text>

        {Object.keys(categoryTotals).length === 0 ? (
          <Text style={{ color: "#9ca3af" }}>No expenses yet.</Text>
        ) : (
          Object.keys(categoryTotals).map((cat) => (
            <Text key={cat} style={styles.categoryTotalItem}>
              {cat}: ${categoryTotals[cat].toFixed(2)}
            </Text>
          ))
        )}
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 12.50)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (Food, Books, Rent...)"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />

        <Button title="Add Expense" onPress={addExpense} />
      </View>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet.</Text>
        }
      />
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Expense</Text>

            <TextInput
              style={styles.input}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={editCategory}
              onChangeText={setEditCategory}
            />
            <TextInput
              style={styles.input}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Note"
            />

            <Button title="Save Changes" onPress={saveEdit} />
            <Button
              title="Cancel"
              color="red"
              onPress={() => setEditModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#111827' },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
    gap: 8,
  },
  input: {
    padding: 10,
    backgroundColor: '#1f2937',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  expenseNote: {
    fontSize: 12,
    color: '#9ca3af',
  },
  delete: {
    color: '#f87171',
    fontSize: 20,
    marginLeft: 12,
  },
  empty: {
    color: '#9ca3af',
    marginTop: 24,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 12,
    fontSize: 12,
  },
});