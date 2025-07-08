import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { CubeIcon, DocumentTextIcon, UsersIcon, TruckIcon, IdentificationIcon, ClipboardDocumentListIcon } from '../constants';
import { Link } from 'react-router-dom';
import { MainContainer } from '../components/layout/MainContainer';
import { MOCK_DOCUMENTS, MOCK_CONSUMPTIONS, MOCK_PROVIDERS, MOCK_SOLICITANTES, MOCK_CATEGORIES, getCategoryNameById } from '../constants';
import { Product, User } from '../types';
import { fetchProducts, fetchUsers } from '../utils/api';

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, to?: string, color: string, subtext?: string }> = ({ title, value, icon, to, color, subtext }) => {
  const content = (
    <div className={`block p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ${color} h-full flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-semibold text-white">
            {typeof value === 'number' ? value.toLocaleString('es-CL') : value}
          </p>
        </div>
        <div className="text-white opacity-75">
          {icon}
        </div>
      </div>
      {subtext && <p className="text-xs text-white opacity-90 mt-2">{subtext}</p>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

// Simple Bar Chart Component (CSS-based)
interface SimpleBarChartData {
  label: string;
  value: number;
  color?: string;
}
interface SimpleBarChartProps {
  data: SimpleBarChartData[];
  title: string;
  maxBarHeight?: number; // in pixels
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, title, maxBarHeight = 150 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 0);
  const defaultBarColor = 'bg-blue-500';

  return (
    <Card title={title} bodyClassName="space-y-2">
      {data.length === 0 ? <p className="text-sm text-neutral-500 dark:text-slate-400">No hay datos para mostrar.</p> :
      <div className="flex justify-around items-end h-[200px] p-2 border-b border-neutral-200 dark:border-slate-700">
        {data.map((item) => (
          <div key={item.label} className="flex flex-col items-center text-center w-1/4 px-1">
            <div 
              className={`w-full md:w-3/4 rounded-t-sm transition-all duration-300 ease-in-out ${item.color || defaultBarColor}`}
              style={{ height: `${maxValue > 0 ? (item.value / maxValue) * maxBarHeight : 0}px` }}
              title={`${item.label}: ${item.value}`}
            >
            </div>
            <p className="text-xs text-neutral-600 dark:text-slate-400 mt-1 truncate w-full" title={item.label}>{item.label}</p>
            <p className="text-xs font-semibold text-neutral-700 dark:text-slate-300">{item.value}</p>
          </div>
        ))}
      </div>
      }
    </Card>
  );
};


const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [usersData, setUsersData] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchUsers()])
      .then(([prodData, userData]) => {
        setProducts(prodData);
        setUsersData(userData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Error al cargar datos');
        setLoading(false);
      });
  }, []);

  const stockAlerts = products.map(product => {
    const stockMin = product.stock_min ?? 0;
    if (product.stock_actual <= stockMin && stockMin > 0) { // Only alert if stock_min is defined and > 0
      return { type: 'error', message: `${product.sku} - ${product.nombre}: Stock BAJO (${product.stock_actual} / Mín: ${stockMin}).`, product };
    }
    if (stockMin > 0 && product.stock_actual > stockMin && product.stock_actual <= stockMin + (stockMin * 0.15)) { // Warning if within 15% above min
      return { type: 'warning', message: `${product.sku} - ${product.nombre}: Stock acercándose (${product.stock_actual} / Mín: ${stockMin}).`, product };
    }
    return null;
  }).filter(alert => alert !== null);

  const criticalAlertsCount = stockAlerts.filter(a => a?.type === 'error').length;

  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock_actual * p.valor_promedio), 0);

  // Data for "Productos por Categoría" chart
  const productsByCategory: { [key: string]: number } = {};
  products.forEach(product => {
    const categoryName = getCategoryNameById(product.categoria_id);
    productsByCategory[categoryName] = (productsByCategory[categoryName] || 0) + 1;
  });
  const productsByCategoryChartData: SimpleBarChartData[] = Object.entries(productsByCategory)
    .map(([label, value]) => ({ label, value }))
    .sort((a,b) => b.value - a.value) // Sort by most products
    .slice(0, 5); // Show top 5 categories

  // Data for "Consumos (Últimos 7 Días)" chart - derived from MOCK_CONSUMPTIONS
    const consumptionsLast7DaysData: SimpleBarChartData[] = Array(7).fill(null).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : `Hace ${i} días`;
        
        const value = MOCK_CONSUMPTIONS.filter(c => {
            if (!c.fecha_consumo) return false;
            const consumptionDate = new Date(c.fecha_consumo).toISOString().split('T')[0];
            return consumptionDate === dateString;
        }).reduce((acc, curr) => acc + curr.items.reduce((itemSum, item) => itemSum + item.cantidad_consumida, 0), 0);

        return { label, value };
    }).reverse(); // To show oldest to newest
  
  const recentActivity = [
    ...(MOCK_DOCUMENTS.length > 0 ? MOCK_DOCUMENTS.slice(0, 1).map(doc => ({
        id: `doc-${doc.id}`,
        text: `Documento '${doc.tipo_documento} #${doc.numero_documento}' ingresado.`,
        link: `/documents`
    })) : []),
    ...(MOCK_CONSUMPTIONS.length > 0 ? MOCK_CONSUMPTIONS.slice(0, 1).map(cons => ({
        id: `cons-${cons.id}`,
        text: `Consumo para OT ${cons.numero_ot} por ${cons.solicitante_nombre}.`,
        link: '/consumptions'
    })) : []),
     usersData.length > 0 ? {
        id: `user-${usersData[usersData.length - 1].id}`,
        text: `Usuario '${usersData[usersData.length - 1].username}' se unió.`,
        link: '/admin/users'
    } : null,
    MOCK_PROVIDERS.length > 0 ? {
        id: `prov-${MOCK_PROVIDERS[MOCK_PROVIDERS.length -1].id}`,
        text: `Proveedor '${MOCK_PROVIDERS[MOCK_PROVIDERS.length -1].nombre}' añadido.`,
        link: '/providers'
    } : null
  ].filter(Boolean).slice(0, 4); // Take the first available 4, no random sort.


  return (
    <MainContainer className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-slate-100">Dashboard</h1>
      <p className="text-lg text-neutral-600 dark:text-slate-300">
        Bienvenido, <span className="font-semibold">{user?.username}</span>. Resumen del estado actual del sistema.
      </p>
      {loading && <p className="text-sm text-neutral-600 dark:text-slate-400">Cargando datos...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard title="Productos Únicos" value={products.length} icon={<CubeIcon className="w-10 h-10"/>} to="/inventory" color="bg-blue-500"/>
        <StatCard title="Documentos" value={MOCK_DOCUMENTS.length} icon={<DocumentTextIcon className="w-10 h-10"/>} to="/documents" color="bg-green-500"/>
        <StatCard title="Consumos" value={MOCK_CONSUMPTIONS.length} icon={<ClipboardDocumentListIcon className="w-10 h-10"/>} to="/consumptions" color="bg-indigo-500"/>
        <StatCard title="Proveedores" value={MOCK_PROVIDERS.length} icon={<TruckIcon className="w-10 h-10"/>} to="/providers" color="bg-purple-500"/>
        <StatCard title="Solicitantes" value={MOCK_SOLICITANTES.length} icon={<IdentificationIcon className="w-10 h-10"/>} to="/requesters" color="bg-pink-500"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Valor Total Inventario" value={`CLP ${totalInventoryValue.toLocaleString('es-CL')}`} icon={<CubeIcon className="w-10 h-10"/>} color="bg-teal-500" subtext="Suma de (Stock Actual * Valor Promedio)"/>
        <StatCard title="Alertas Stock Crítico" value={criticalAlertsCount} icon={<CubeIcon className="w-10 h-10"/>} to="/inventory" color={criticalAlertsCount > 0 ? "bg-red-500" : "bg-neutral-500"} subtext={criticalAlertsCount > 0 ? "Productos bajo el mínimo configurado." : "Todo el stock sobre el mínimo."}/>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <SimpleBarChart title="Productos por Categoría (Top 5)" data={productsByCategoryChartData} />
         <SimpleBarChart title="Consumos Totales (Últimos 7 Días)" data={consumptionsLast7DaysData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Actividad Reciente (Máx. 4)">
          {recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {recentActivity.map((activity) => (
                <li key={activity?.id} className="text-sm text-neutral-700 dark:text-slate-300">
                  <Link to={activity?.link || '#'} className="hover:text-primary dark:hover:text-primary-light transition-colors">{activity?.text}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-slate-400">No hay actividad reciente para mostrar.</p>
          )}
        </Card>
        <Card title="Alertas de Stock (Todas)">
           {stockAlerts.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {stockAlerts.map((alert, index) => (
                <li 
                  key={`${alert?.product.id}-${index}`} 
                  className={`text-sm p-2 rounded-md ${
                    alert?.type === 'error' ? 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-700 dark:text-yellow-300'
                  }`}
                >
                  <Link to="/inventory" className="hover:underline">
                    {alert?.message}
                  </Link>
                </li>
              ))}
            </ul>
           ) : (
            <p className="text-sm text-neutral-500 dark:text-slate-400">No hay alertas de stock en este momento.</p>
           )}
        </Card>
      </div>
    </MainContainer>
  );
};

export default DashboardPage;