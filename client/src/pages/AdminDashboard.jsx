import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/products";
import { getOrders, updateOrderStatus, searchOrders } from "../api/orders";
import ConfirmModal from "../components/ConfirmModal";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-[#3b82f6]" xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const statusColors = {
  PENDING:    "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED:  "bg-green-50 text-green-700 border-green-200",
  CANCELLED:  "bg-rose-50 text-rose-700 border-rose-200",
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("inventory");

  // ── Products state ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ── Orders state ───────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSearching, setOrderSearching] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [picture, setPicture] = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data.products);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getOrders();
      setOrders(res.data.orders);
    } catch (e) {
      console.error("Error fetching orders:", e);
      toast.error("Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (activeTab === "orders") fetchAdminOrders(); }, [activeTab]);

  // ── Order search via Elasticsearch (debounced) ─────────────────────────────
  useEffect(() => {
    if (activeTab !== "orders") return;

    if (!orderSearch.trim()) {
      fetchAdminOrders();
      return;
    }

    setOrderSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchOrders(orderSearch.trim());
        setOrders(res.data.orders);
      } catch (e) {
        console.error("Order search error:", e);
      } finally {
        setOrderSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [orderSearch, activeTab]);

  // ── Filtered products (local, instant) ────────────────────────────────────
  const filteredProducts = productSearch.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(productSearch.toLowerCase())
      )
    : products;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success("Order status updated");
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update status");
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price);
    setStock(product.stock);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    if (picture) formData.append("picture", picture);
    try {
      if (editingId) {
        await updateProduct(editingId, formData);
        toast.success("Product updated successfully");
      } else {
        await createProduct(formData);
        toast.success("Product created successfully");
      }
      handleCancel();
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed to ${editingId ? "update" : "create"} product`);
    }
  };

  const executeDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleConfirmDelete = () => {
    if (confirmModal.type === "product") executeDeleteProduct(confirmModal.id);
    setConfirmModal({ isOpen: false, type: null, id: null });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setName(""); setDescription(""); setPrice(""); setStock(""); setPicture(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-xl font-medium text-slate-400">
      Loading admin panel...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-20">
        <h1 className="font-display text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        {activeTab === "inventory" && (
          <button
            onClick={() => (showForm ? handleCancel() : setShowForm(true))}
            className={`px-6 py-3 rounded-md font-sans font-medium transition-all shadow-lg ${
              showForm
                ? "bg-slate-100 text-slate-600 shadow-none hover:bg-slate-200"
                : "bg-[#3b82f6] text-white shadow-blue-500/20 hover:bg-blue-600"
            }`}
          >
            {showForm ? "Cancel" : "+ Add New Product"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-slate-200">
        {["inventory", "orders"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 font-bold text-lg border-b-2 capitalize transition-colors ${
              activeTab === tab
                ? "border-[#3b82f6] text-[#3b82f6]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── INVENTORY TAB ── */}
      {activeTab === "inventory" && (
        <>
          {showForm && (
            <div className="bg-white p-8 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-12">
              <h2 className="font-display text-2xl font-semibold text-slate-900 mb-6">
                {editingId ? "Edit Product" : "Create New Product"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Product Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all text-sm"
                      placeholder="e.g. Premium Wireless Headphones" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Product Image {editingId && "(Optional)"}
                    </label>
                    <input type="file" accept="image/*" onChange={(e) => setPicture(e.target.files[0])}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#eff6ff] file:text-[#3b82f6] hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all min-h-[100px] text-sm"
                    placeholder="Describe your product details..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Price (Rs)</label>
                    <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all text-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Stock Quantity</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all text-sm" required />
                  </div>
                </div>
                <button type="submit"
                  className="w-full py-3.5 bg-[#3b82f6] hover:bg-blue-600 text-white font-medium rounded-md transition-colors shadow-lg shadow-blue-500/20 text-sm">
                  {editingId ? "Update Product" : "Publish Product"}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden font-sans">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-slate-900 shrink-0">Product List</h2>
              {/* Local filter search */}
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><SearchIcon /></span>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter products…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.picture ? (
                              <img src={`http://localhost:5002/uploads/${product.picture}`} alt=""
                                className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">N/A</div>
                            )}
                          </div>
                          <span className="font-semibold text-slate-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#3b82f6]">Rs {parseFloat(product.price).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock > 10 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button onClick={() => handleEditClick(product)}
                          className="text-[#3b82f6] hover:text-blue-700 font-semibold text-sm transition-colors">Edit</button>
                        <button onClick={() => setConfirmModal({ isOpen: true, type: "product", id: product.id })}
                          className="text-rose-500 hover:text-rose-700 font-semibold text-sm transition-colors">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-medium">
                  {productSearch ? `No products match "${productSearch}"` : "No products in inventory yet."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden font-sans">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-slate-900 shrink-0">Customer Orders</h2>
            {/* Elasticsearch fuzzy search */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><SearchIcon /></span>
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by name, email… (typos OK!)"
                className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all"
              />
              {orderSearching && (
                <span className="absolute inset-y-0 right-3 flex items-center"><Spinner /></span>
              )}
            </div>
          </div>

          {loadingOrders ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[250px]">Items</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 break-all min-w-[200px]">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="font-semibold text-slate-900">{order.customer_name}</div>
                        <div className="text-sm text-slate-500 mb-1">{order.customer_phone || "No phone"}</div>
                        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                          {order.customer_address}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.items?.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                                  {item.product_picture ? (
                                    <img src={`http://localhost:5002/uploads/${item.product_picture}`}
                                      alt={item.product_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium">N/A</div>
                                  )}
                                </div>
                                <div className="text-sm min-w-0">
                                  <div className="font-medium text-slate-900 truncate max-w-[150px]" title={item.product_name}>
                                    {item.product_name || "Unknown Product"}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Qty: {item.quantity} × Rs {parseFloat(item.price).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">No items found</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#3b82f6]">
                          Rs {parseFloat(order.total_amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold outline-none border cursor-pointer appearance-none text-center min-w-[100px] ${statusColors[order.status] || ""}`}
                        >
                          {Object.keys(statusColors).map((s) => (
                            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-medium">
                  {orderSearch ? `No orders found for "${orderSearch}"` : "No orders have been placed yet."}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, id: null })}
      />
    </div>
  );
};

export default AdminDashboard;
