import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Paper,
  Typography,
  Alert,
  Menu,
  Divider,
  Card,
  CardContent,
  CardActions,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Inventory as ProductIcon,
  Science as RegulationIcon,
  Security as RiskIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

import { Product, ProductFormData, RegulationType, RiskClassification } from '../../types';
import { useProducts } from '../../hooks';

interface ProductManagementProps {
  projectId: string;
  products: Product[];
  onProductsChange?: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  projectId,
  products,
  onProductsChange,
}) => {
  const { createProduct, updateProduct, deleteProduct } = useProducts(projectId);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    device_type: '',
    intended_use: '',
    regulation_type: RegulationType.NON_IVD,
    risk_classification: RiskClassification.CLASS_I,
    manufacturer: '',
  });

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Event handlers
  const handleCreateProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      await createProduct(projectId, formData);
      setCreateDialogOpen(false);
      resetForm();
      onProductsChange?.();
    } catch (error) {
      console.error('Failed to create product:', error);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      setError(null);
      await updateProduct(selectedProduct.id, formData);
      setEditDialogOpen(false);
      resetForm();
      handleMenuClose();
      onProductsChange?.();
    } catch (error) {
      console.error('Failed to update product:', error);
      setError('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      setError(null);
      await deleteProduct(selectedProduct.id);
      setDeleteDialogOpen(false);
      handleMenuClose();
      onProductsChange?.();
    } catch (error) {
      console.error('Failed to delete product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = () => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name,
        description: selectedProduct.description || '',
        device_type: selectedProduct.device_type,
        intended_use: selectedProduct.intended_use,
        regulation_type: selectedProduct.regulation_type,
        risk_classification: selectedProduct.risk_classification,
        manufacturer: selectedProduct.manufacturer || '',
      });
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setSelectedProduct(product);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedProduct(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      device_type: '',
      intended_use: '',
      regulation_type: RegulationType.NON_IVD,
      risk_classification: RiskClassification.CLASS_I,
      manufacturer: '',
    });
    setError(null);
  };

  const getRiskColor = (risk: RiskClassification) => {
    switch (risk) {
      case RiskClassification.CLASS_I:
        return 'success';
      case RiskClassification.CLASS_II:
        return 'warning';
      case RiskClassification.CLASS_III:
        return 'error';
      case RiskClassification.CLASS_IV:
        return 'error';
      default:
        return 'default';
    }
  };

  const getRegulationIcon = (type: RegulationType) => {
    return type === RegulationType.IVD ? '🧪' : '🏥';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (products.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <ProductIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No products yet
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Add your first product to get started with regulatory submissions.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Product
        </Button>

        {/* Create Product Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Device Type"
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                placeholder="e.g., Blood Glucose Monitor, Surgical Instrument"
                required
                fullWidth
              />
              <TextField
                label="Intended Use"
                value={formData.intended_use}
                onChange={(e) => setFormData({ ...formData, intended_use: e.target.value })}
                placeholder="Clinical purpose and intended patient population"
                multiline
                rows={2}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Regulation Type</InputLabel>
                <Select
                  value={formData.regulation_type}
                  onChange={(e) => setFormData({ ...formData, regulation_type: e.target.value as RegulationType })}
                  label="Regulation Type"
                >
                  <MenuItem value={RegulationType.NON_IVD}>Non-IVD Medical Device</MenuItem>
                  <MenuItem value={RegulationType.IVD}>In Vitro Diagnostic (IVD)</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Risk Classification</InputLabel>
                <Select
                  value={formData.risk_classification}
                  onChange={(e) => setFormData({ ...formData, risk_classification: e.target.value as RiskClassification })}
                  label="Risk Classification"
                >
                  <MenuItem value={RiskClassification.CLASS_I}>Class I (Low Risk)</MenuItem>
                  <MenuItem value={RiskClassification.CLASS_II}>Class II (Medium Risk)</MenuItem>
                  <MenuItem value={RiskClassification.CLASS_III}>Class III (High Risk)</MenuItem>
                  <MenuItem value={RiskClassification.CLASS_IV}>Class IV (Very High Risk)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProduct}
              variant="contained"
              disabled={!formData.name.trim() || !formData.device_type.trim() || !formData.intended_use.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Products ({products.length})</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add Product
        </Button>
      </Box>

      {/* Products Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 2 
      }}>
        {products.map((product) => (
          <Card key={product.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getRegulationIcon(product.regulation_type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.regulation_type === RegulationType.IVD ? 'IVD Device' : 'Medical Device'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, product)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Device Type:</strong> {product.device_type}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Intended Use:</strong> {product.intended_use}
              </Typography>
              {product.manufacturer && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Manufacturer:</strong> {product.manufacturer}
                </Typography>
              )}
              {product.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {product.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  icon={<RiskIcon />}
                  label={product.risk_classification}
                  color={getRiskColor(product.risk_classification) as any}
                  size="small"
                />
                <Chip
                  icon={<RegulationIcon />}
                  label={product.regulation_type}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Typography variant="caption" color="text.secondary">
                Created {formatDate(product.created_at)}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<ViewIcon />}>
                View Details
              </Button>
              <Button size="small" startIcon={<EditIcon />} onClick={() => {
                setSelectedProduct(product);
                openEditDialog();
              }}>
                Edit
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          // View product details functionality
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={openEditDialog}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Product
        </MenuItem>
        <Divider />
        <MenuItem onClick={openDeleteDialog} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Product
        </MenuItem>
      </Menu>

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Regulation Type</InputLabel>
              <Select
                value={formData.regulation_type}
                onChange={(e) => setFormData({ ...formData, regulation_type: e.target.value as RegulationType })}
                label="Regulation Type"
              >
                <MenuItem value={RegulationType.NON_IVD}>Non-IVD Medical Device</MenuItem>
                <MenuItem value={RegulationType.IVD}>In Vitro Diagnostic (IVD)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Risk Classification</InputLabel>
              <Select
                value={formData.risk_classification}
                onChange={(e) => setFormData({ ...formData, risk_classification: e.target.value as RiskClassification })}
                label="Risk Classification"
              >
                <MenuItem value={RiskClassification.CLASS_I}>Class I (Low Risk)</MenuItem>
                <MenuItem value={RiskClassification.CLASS_II}>Class II (Medium Risk)</MenuItem>
                <MenuItem value={RiskClassification.CLASS_III}>Class III (High Risk)</MenuItem>
                <MenuItem value={RiskClassification.CLASS_IV}>Class IV (Very High Risk)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateProduct}
            variant="contained"
            disabled={!formData.name.trim() || !formData.device_type.trim() || !formData.intended_use.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Device Type"
              value={formData.device_type}
              onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
              placeholder="e.g., Blood Glucose Monitor, Surgical Instrument"
              required
              fullWidth
            />
            <TextField
              label="Intended Use"
              value={formData.intended_use}
              onChange={(e) => setFormData({ ...formData, intended_use: e.target.value })}
              placeholder="Clinical purpose and intended patient population"
              multiline
              rows={2}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Regulation Type</InputLabel>
              <Select
                value={formData.regulation_type}
                onChange={(e) => setFormData({ ...formData, regulation_type: e.target.value as RegulationType })}
                label="Regulation Type"
              >
                <MenuItem value={RegulationType.NON_IVD}>Non-IVD Medical Device</MenuItem>
                <MenuItem value={RegulationType.IVD}>In Vitro Diagnostic (IVD)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Risk Classification</InputLabel>
              <Select
                value={formData.risk_classification}
                onChange={(e) => setFormData({ ...formData, risk_classification: e.target.value as RiskClassification })}
                label="Risk Classification"
              >
                <MenuItem value={RiskClassification.CLASS_I}>Class I (Low Risk)</MenuItem>
                <MenuItem value={RiskClassification.CLASS_II}>Class II (Medium Risk)</MenuItem>
                <MenuItem value={RiskClassification.CLASS_III}>Class III (High Risk)</MenuItem>
                <MenuItem value={RiskClassification.CLASS_IV}>Class IV (Very High Risk)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleEditProduct}
            variant="contained"
            disabled={!formData.name.trim() || !formData.device_type.trim() || !formData.intended_use.trim() || loading}
          >
            {loading ? 'Updating...' : 'Update Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone and will also delete any associated submissions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProduct}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductManagement;