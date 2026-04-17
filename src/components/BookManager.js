'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function BookManager() {
  const [books, setBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', year: '', status: 'reading' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const booksRef = collection(db, 'books');
    const unsubscribe = onSnapshot(booksRef, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(booksData);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      const bookRef = doc(db, 'books', editingId);
      await updateDoc(bookRef, {
        ...formData,
        updatedAt: new Date()
      });
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'books'), {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    setFormData({ title: '', author: '', year: '', status: 'reading' });
    setShowForm(false);
  };

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      year: book.year,
      status: book.status
    });
    setEditingId(book.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this book?')) {
      await deleteDoc(doc(db, 'books', id));
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Title', 'Author', 'Year', 'Status'],
      ...books.map(b => [b.title, b.author, b.year, b.status])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books.csv';
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reading': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'want-to-read': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
      <div className="p-5 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Book Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ title: '', author: '', year: '', status: 'reading' });
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Book'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="p-5 bg-gray-700 border-b border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="reading">Reading</option>
              <option value="completed">Completed</option>
              <option value="want-to-read">Want to Read</option>
            </select>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
            >
              {editingId ? 'Update Book' : 'Add Book'}
            </button>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-700">
        {books.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No books yet. Add one to get started!
          </div>
        ) : (
          books.map(book => (
            <div key={book.id} className="p-4 hover:bg-gray-700 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-white">{book.title}</h3>
                  <p className="text-gray-400 text-sm">{book.author}</p>
                  {book.year && <p className="text-gray-500 text-xs">{book.year}</p>}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(book.status)}`}>
                  {book.status.replace('-', ' ')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(book)}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
