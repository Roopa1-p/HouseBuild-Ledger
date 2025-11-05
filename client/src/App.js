import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Toolbar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TableFooter,
  Grid,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import Analytics from './components/Analytics';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

const App = () => {
  const [expenses, setExpenses] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });
  const [budget, setBudget] = useState(0);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(0);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/expenses`);
      setExpenses(response.data);
    } catch (error)      console.error('Error fetching expenses:', error);
    }
  };

  const handleOpen = (expense = null) => {
    setCurrentExpense(expense);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentExpense(null);
  };

  const handleSave = async () => {
    try {
      if (currentExpense && currentExpense.id) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/expenses/${currentExpense.id}`, currentExpense);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/expenses`, currentExpense);
      }
      fetchExpenses();
      handleClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleChange = (e) => {
    setCurrentExpense({ ...currentExpense, [e.target.name]: e.target.value });
  };

  const sortedFilteredExpenses = useMemo(() => {
    let sortedExpenses = [...expenses];
    if (sortConfig.key) {
      sortedExpenses.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    if (filterCategory) {
      sortedExpenses = sortedExpenses.filter(
        (expense) => expense.category === filterCategory
      );
    }

    if (searchTerm) {
      sortedExpenses = sortedExpenses.filter((expense) =>
        Object.values(expense).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return sortedExpenses;
  }, [expenses, sortConfig, filterCategory, searchTerm]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const categories = [...new Set(expenses.map((expense) => expense.category))];

  const totalAmount = sortedFilteredExpenses.reduce(
    (acc, expense) => acc + expense.amount,
    0
  );

  const remainingBudget = budget - totalAmount;

  const handleExportExcel = () => {
    const csv = Papa.unparse(sortedFilteredExpenses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'expenses.csv');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Date', 'Category', 'Description', 'Vendor', 'Amount', 'Status']],
      body: sortedFilteredExpenses.map((expense) => [
        expense.date,
        expense.category,
        expense.description,
        expense.vendor,
        expense.amount,
        expense.status,
      ]),
    });
    doc.save('expenses.pdf');
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/expenses/import`, formData);
      fetchExpenses();
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/expenses/backup`);
      const blob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      saveAs(blob, 'expenses.json');
    } catch (error) {
      console.error('Error backing up expenses:', error);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const expenses = JSON.parse(event.target.result);
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/expenses/restore`, expenses);
        fetchExpenses();
      } catch (error) {
        console.error('Error restoring expenses:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleBudgetOpen = () => {
    setNewBudget(budget);
    setBudgetOpen(true);
  };

  const handleBudgetClose = () => {
    setBudgetOpen(false);
  };

  const handleBudgetSave = () => {
    setBudget(newBudget);
    handleBudgetClose();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        House Construction Expense Ledger
      </Typography>
      <Toolbar>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Expense
        </Button>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ ml: 2 }}
        />
        <FormControl variant="outlined" size="small" sx={{ ml: 2, minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleExportExcel} sx={{ ml: 2 }}>
          Export Excel
        </Button>
        <Button variant="contained" onClick={handleExportPDF} sx={{ ml: 2 }}>
          Export PDF
        </Button>
        <Button component="label" variant="contained" sx={{ ml: 2 }}>
          Import CSV
          <input type="file" hidden onChange={handleImportCSV} />
        </Button>
        <Button variant="contained" onClick={handleBackup} sx={{ ml: 2 }}>
          Backup
        </Button>
        <Button component="label" variant="contained" sx={{ ml: 2 }}>
          Restore
          <input type="file" hidden onChange={handleRestore} />
        </Button>
        <Button variant="contained" onClick={handleBudgetOpen} sx={{ ml: 2 }}>
          Set Budget
        </Button>
      </Toolbar>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Budget</Typography>
            <Typography variant="h5">{budget}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Spent</Typography>
            <Typography variant="h5">{totalAmount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Remaining Budget</Typography>
            <Typography variant="h5">{remainingBudget}</Typography>
          </Paper>
        </Grid>
      </Grid>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => requestSort('date')}>Date</TableCell>
              <TableCell onClick={() => requestSort('category')}>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell onClick={() => requestSort('vendor')}>Vendor</TableCell>
              <TableCell onClick={() => requestSort('amount')}>Amount</TableCell>
              <TableCell onClick={() => requestSort('status')}>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedFilteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.vendor}</TableCell>
                <TableCell>{expense.amount}</TableCell>
                <TableCell>{expense.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(expense)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(expense.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} />
              <TableCell>
                <Typography variant="h6">Total:</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6">{totalAmount}</Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Analytics expenses={expenses} />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentExpense && currentExpense.id ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent>
          <TextField name="date" label="Date" value={currentExpense?.date || ''} onChange={handleChange} fullWidth margin="dense" />
          <TextField name="category" label="Category" value={currentExpense?.category || ''} onChange={handleChange} fullWidth margin="dense" />
          <TextField name="description" label="Description" value={currentExpense?.description || ''} onChange={handleChange} fullWidth margin="dense" />
          <TextField name="vendor" label="Vendor" value={currentExpense?.vendor || ''} onChange={handleChange} fullWidth margin="dense" />
          <TextField name="amount" label="Amount" value={currentExpense?.amount || ''} onChange={handleChange} fullWidth margin="dense" />
          <TextField name="status" label="Status" value={currentExpense?.status || ''} onChange={handleChange} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={budgetOpen} onClose={handleBudgetClose}>
        <DialogTitle>Set Budget</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Budget"
            type="number"
            fullWidth
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBudgetClose}>Cancel</Button>
          <Button onClick={handleBudgetSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;
