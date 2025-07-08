export const API_BASE_URL = 'https://dummyjson.com';

import { Product, User, UserRole } from '../types';

// Helper to map data from dummyjson to our Product type
const mapProduct = (item: any): Product => {
  return {
    id: String(item.id),
    sku: String(item.id),
    nombre: item.title,
    descripcion: item.description,
    un_medida: 'unit',
    ubicacion: 'N/A',
    categoria_id: item.category ?? 'general',
    valor_promedio: item.price ?? 0,
    stock_actual: item.stock ?? 0,
    proveedor_predeterminado: '',
    fecha_ultimo_ingreso: new Date().toISOString().split('T')[0],
  };
};

export const fetchProducts = async (): Promise<Product[]> => {
  const resp = await fetch(`${API_BASE_URL}/products`);
  if (!resp.ok) {
    throw new Error('Error fetching products');
  }
  const data = await resp.json();
  return (data.products || []).map(mapProduct);
};

const mapUser = (item: any): User => {
  const roleValues = Object.values(UserRole);
  const randomRole = roleValues[Math.floor(Math.random() * roleValues.length)];
  return {
    id: String(item.id),
    username: item.username || item.firstName,
    role: randomRole as UserRole,
  };
};

export const fetchUsers = async (): Promise<User[]> => {
  const resp = await fetch(`${API_BASE_URL}/users`);
  if (!resp.ok) {
    throw new Error('Error fetching users');
  }
  const data = await resp.json();
  return (data.users || []).map(mapUser);
};
