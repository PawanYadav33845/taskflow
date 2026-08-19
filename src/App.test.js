import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('renders TaskFlow header and Sign In button', () => {
  render(<App />);
  const headerTitle = screen.getByRole('heading', { level: 1 });
  expect(headerTitle).toHaveTextContent(/TaskFlow/i);
  expect(screen.getByRole('button', { name: /Sign In \/ Register/i })).toBeInTheDocument();
});

test('allows user to add a new task', () => {
  render(<App />);
  const input = screen.getByPlaceholderText(/What needs to be done/i);
  const addButton = screen.getByRole('button', { name: /Add Task/i });

  fireEvent.change(input, { target: { value: 'Buy groceries' } });
  fireEvent.click(addButton);

  expect(screen.getByText('Buy groceries')).toBeInTheDocument();
});

test('allows user to toggle task completion status', () => {
  render(<App />);
  const input = screen.getByPlaceholderText(/What needs to be done/i);
  const addButton = screen.getByRole('button', { name: /Add Task/i });

  fireEvent.change(input, { target: { value: 'Practice coding' } });
  fireEvent.click(addButton);

  const toggleButtons = screen.getAllByRole('button', { name: /Mark task as/i });
  expect(toggleButtons.length).toBeGreaterThan(0);
  
  fireEvent.click(toggleButtons[0]);
  expect(screen.getByRole('status')).toBeInTheDocument();
});

test('filters tasks by search query', () => {
  render(<App />);
  const input = screen.getByPlaceholderText(/What needs to be done/i);
  const addButton = screen.getByRole('button', { name: /Add Task/i });

  fireEvent.change(input, { target: { value: 'Complete React project' } });
  fireEvent.click(addButton);

  const searchInput = screen.getByPlaceholderText(/Search tasks/i);
  
  fireEvent.change(searchInput, { target: { value: 'React project' } });
  expect(screen.getByText(/Complete React project/i)).toBeInTheDocument();

  fireEvent.change(searchInput, { target: { value: 'NonexistentTaskXYZ' } });
  expect(screen.getByText(/No tasks found/i)).toBeInTheDocument();
});

test('opens Auth Modal when Sign In / Register button is clicked', async () => {
  render(<App />);
  const signInButton = screen.getByRole('button', { name: /Sign In \/ Register/i });
  fireEvent.click(signInButton);

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  expect(screen.getByPlaceholderText(/Enter login ID or email/i)).toBeInTheDocument();
});
