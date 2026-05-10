import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/products";
import { getOrders, updateOrderStatus, deleteOrder } from "../api/orders";
import ConfirmModal from "../components/ConfirmModal";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("inventory");
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [picture, setPicture] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getOrders();
      setOrders(res.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchAdminOrders();
    }
  }, [activeTab]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success("Order status updated");
      // Update local state without refetching to keep it fast
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteOrderClick = (orderId) => {
    setConfirmModal({ isOpen: true, type: 'order', id: orderId });
  };

  const executeDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId);
      toast.success("Order deleted successfully");
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error.response?.data?.message || "Failed to delete order");
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
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} product`);
    }
  };

  const handleDeleteProductClick = (id) => {
    setConfirmModal({ isOpen: true, type: 'product', id });
  };

  const executeDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleConfirmDelete = () => {
    if (confirmModal.type === 'product') {
      executeDeleteProduct(confirmModal.id);
    } else if (confirmModal.type === 'order') {
      executeDeleteOrder(confirmModal.id);
    }
    setConfirmModal({ isOpen: false, type: null, id: null });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setPicture(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-xl font-medium text-slate-400">
      Loading admin panel...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8 pt-20">
        <h1 className="font-display text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        {activeTab === "inventory" && (
          <button 
            onClick={() => (showForm ? handleCancel() : setShowForm(true))}
            className={`px-6 py-3 rounded-md font-sans font-medium transition-all shadow-lg ${showForm ? 'bg-slate-100 text-slate-600 shadow-none hover:bg-slate-200' : 'bg-[#3b82f6] text-white shadow-blue-500/20 hover:bg-blue-600'}`}
          >
            {showForm ? "Cancel" : "+ Add New Product"}
          </button>
        )}
      </div>

      <div className="flex space-x-4 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`py-3 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === "inventory" ? "border-[#3b82f6] text-[#3b82f6]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`py-3 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === "orders" ? "border-[#3b82f6] text-[#3b82f6]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Orders
        </button>
      </div>

      {activeTab === "inventory" ? (
        <>
          {showForm && (
        <div className="bg-white p-8 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-display text-2xl font-semibold text-slate-900 mb-6">
            {editingId ? "Edit Product" : "Create New Product"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all text-sm"
                  placeholder="e.g. Premium Wireless Headphones"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Product Image {editingId && "(Optional)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPicture(e.target.files[0])}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#eff6ff] file:text-[#3b82f6] hover:file:bg-blue-100 cursor-pointer text-sm text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all min-h-[100px] text-sm"
                placeholder="Describe your product details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Price (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Stock Quantity</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-[#3b82f6] hover:bg-blue-600 text-white font-medium rounded-md transition-colors shadow-lg shadow-blue-500/20 text-sm">
              {editingId ? "Update Product" : "Publish Product"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden font-sans">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="font-display text-xl font-semibold text-slate-900">Product List</h2>
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
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.picture ? (
                          <img
                            src={`http://localhost:5002/uploads/${product.picture}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-[#3b82f6] hover:text-blue-700 font-semibold text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProductClick(product.id)}
                      className="text-rose-500 hover:text-rose-700 font-semibold text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-medium">
            No products in inventory yet.
          </div>
        )}
      </div>
      </>
      ) : (
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden font-sans">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="font-display text-xl font-semibold text-slate-900">Customer Orders</h2>
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
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
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
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">{order.customer_address}</div>
                    </td>
                    <td className="px-6 py-4">
                      {order.items && order.items.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                                {item.product_picture ? (
                                  <img
                                    src={`http://localhost:5002/uploads/${item.product_picture}`}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium">N/A</div>
                                )}
                              </div>
                              <div className="text-sm min-w-0">
                                <div className="font-medium text-slate-900 truncate max-w-[150px]" title={item.product_name}>{item.product_name || 'Unknown Product'}</div>
                                <div className="text-xs text-slate-500">Qty: {item.quantity} × Rs {parseFloat(item.price).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">No items found</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#3b82f6]">Rs {parseFloat(order.total_amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold outline-none border cursor-pointer appearance-none text-center min-w-[100px]
                          ${order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            order.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'SHIPPED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            order.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }
                        `}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteOrderClick(order.id)}
                        className="text-rose-500 hover:text-rose-700 font-semibold text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {orders.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-medium">
                No orders have been placed yet.
              </div>
            )}
          </div>
        )}
      </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={`Delete ${confirmModal.type === 'order' ? 'Order' : 'Product'}`}
        message={`Are you sure you want to permanently delete this ${confirmModal.type}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, id: null })}
      />
    </div>
  );
};

export default AdminDashboard;
