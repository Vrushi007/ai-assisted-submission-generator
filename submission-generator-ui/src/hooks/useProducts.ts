import { useState, useCallback } from 'react';
import { Product, ProductFormData, PaginatedResponse } from '../types';
import { apiService } from '../services/api';
import { useApp } from '../contexts/AppContext';

export const useProducts = (projectId?: string) => {
  const { setLoading } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLocalLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });

  const loadProducts = useCallback(async (
    filterProjectId?: string,
    page = 1, 
    size = 10
  ) => {
    try {
      setLocalLoading(true);
      setLoading('projects', true);
      const response: PaginatedResponse<Product> = await apiService.getProducts(
        filterProjectId || projectId, 
        page, 
        size
      );
      
      setProducts(response.items);
      setPagination({
        page: response.page,
        size: response.size,
        total: response.total,
        pages: response.pages,
      });
      
      setLocalLoading(false);
      setLoading('projects', false);
      return response;
    } catch (error) {
      console.error('Error loading products:', error);
      setLocalLoading(false);
      setLoading('projects', false, 'Failed to load products');
      throw error;
    }
  }, [setLoading, projectId]);

  const createProduct = useCallback(async (
    productProjectId: string,
    productData: ProductFormData
  ): Promise<Product> => {
    try {
      setLocalLoading(true);
      const newProduct = await apiService.createProduct(productProjectId, productData);
      
      // Reload products to get updated list
      await loadProducts(productProjectId);
      
      setLocalLoading(false);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      setLocalLoading(false);
      throw error;
    }
  }, [loadProducts]);

  const updateProduct = useCallback(async (
    id: string, 
    productData: Partial<ProductFormData>
  ): Promise<Product> => {
    try {
      setLocalLoading(true);
      const updatedProduct = await apiService.updateProduct(id, productData);
      
      // Update local state
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      
      setLocalLoading(false);
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      setLocalLoading(false);
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      setLocalLoading(true);
      await apiService.deleteProduct(id);
      
      // Remove from local state
      setProducts(prev => prev.filter(p => p.id !== id));
      
      setLocalLoading(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      setLocalLoading(false);
      throw error;
    }
  }, []);

  const getProduct = useCallback(async (id: string): Promise<Product> => {
    try {
      const product = await apiService.getProduct(id);
      return product;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }, []);

  const changePage = useCallback(async (newPage: number) => {
    await loadProducts(projectId, newPage, pagination.size);
  }, [loadProducts, projectId, pagination.size]);

  const changePageSize = useCallback(async (newSize: number) => {
    await loadProducts(projectId, 1, newSize);
  }, [loadProducts, projectId]);

  return {
    products,
    pagination,
    loading,
    
    // Actions
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    changePage,
    changePageSize,
  };
};

export default useProducts;