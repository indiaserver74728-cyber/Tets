import React, { useState, useEffect, useRef, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import ConfirmModal from '../../components/ConfirmModal';
import MediaDisplay from '../../components/MediaDisplay';
import { ToastContext } from '../../contexts';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';
import { style } from 'framer-motion/client';

interface CategoriesProps {
    categories: types.Category[];
    setCategories: React.Dispatch<React.SetStateAction<types.Category[]>>;
}

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: types.Category | null;
    onSave: (category: Partial<types.Category> & { position?: string }) => Promise<void>;
    categories: types.Category[];
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, onSave, categories }) => {
    const [formData, setFormData] = useState({ name: '', imageUrl: '', position: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toastContext = useContext(ToastContext);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: category ? category.name : '',
                imageUrl: category ? category.imageUrl : '',
                position: category ? String(category.position ?? categories.length + 1) : String(categories.length + 1)
            });
            if(window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen, category, categories]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
                toastContext?.showToast('Media uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="relative bg-dark-card border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg/50">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icon name={category ? "edit-3" : "plus-circle"} size={20} className="text-brand-primary" />
                            {category ? 'Edit Category' : 'New Category'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Define game mode details</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Icon name="x" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    {/* Image Preview */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Cover Media</label>
                        <div className="w-full aspect-video rounded-xl bg-black/40 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center relative">
                            {isUploading ? (
                                <div className="flex flex-col items-center justify-center text-white">
                                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <p className="text-xs mt-2 font-bold">Uploading...</p>
                                </div>
                            ) : formData.imageUrl ? (
                                <MediaDisplay src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-600 flex flex-col items-center">
                                    <Icon name="image" size={32} className="mb-2 opacity-50" />
                                    <span className="text-xs font-medium">No Media</span>
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                            <Icon name="upload-cloud" size={14}/> Upload File
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,image/gif" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Name</label>
                            <div className="relative">
                                <Icon name="type" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Battle Royale"
                                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm outline-none placeholder-gray-600"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Position</label>
                            <div className="relative">
                                <Icon name="list-ordered" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="number" 
                                    value={formData.position} 
                                    onChange={e => setFormData({...formData, position: e.target.value})}
                                    placeholder="Order"
                                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm outline-none placeholder-gray-600"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Media URL</label>
                        <div className="relative">
                            <Icon name="link" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="url" 
                                value={formData.imageUrl} 
                                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                                placeholder="https://example.com/image.jpg"
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm outline-none placeholder-gray-600"
                                required
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 bg-dark-bg flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold text-sm transition-colors border border-white/5">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSaving || isUploading} 
                        className="flex-1 bg-brand-primary text-black py-3 rounded-xl font-bold text-sm hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="check" size={18} />}
                        {category ? 'Update Category' : 'Create Category'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminCategoriesScreen: React.FC<CategoriesProps> = ({ categories, setCategories }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<types.Category | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropTargetId, setDropTargetId] = useState<number | null>(null);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [categories]);

    const handleCreate = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = (category: types.Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Partial<types.Category> & { position?: string }) => {
        const parsedPosition = parseInt(data.position || '', 10);
        const position = isNaN(parsedPosition) ? categories.length + 1 : parsedPosition;

        const saveData = {
            name: data.name,
            imageUrl: data.imageUrl,
            position: position
        };

        try {
            if (editingCategory) {
                // Update
                const updatedCategory = { ...editingCategory, ...saveData };
                await updateDoc(doc(db, 'categories', editingCategory.id.toString()), saveData);
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? updatedCategory : c));
            } else {
                // Create
                const id = Date.now();
                const newCategory: types.Category = {
                    id,
                    name: saveData.name!,
                    imageUrl: saveData.imageUrl!,
                    position: saveData.position
                };
                await setDoc(doc(db, 'categories', id.toString()), newCategory);
                setCategories(prev => [...prev, newCategory]);
            }
        } catch (error) {
            console.error("Error saving category:", error);
            alert("Failed to save category.");
        }
    };

    const initiateDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId === null) return;
        try {
            await deleteDoc(doc(db, 'categories', deleteId.toString()));
            setCategories(prev => prev.filter(c => c.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            alert('Failed to delete category.');
        }
    };

    const sortedCategories = [...categories].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

    const filteredCategories = sortedCategories.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        setDraggedId(null);
        setDropTargetId(null);
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
        e.preventDefault();
        if (draggedId !== null && draggedId !== targetId) {
            setDropTargetId(targetId);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
        e.preventDefault();
        setDropTargetId(null);
        if (draggedId === null || draggedId === targetId) return;

        const currentSortedCategories = [...categories].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
        
        const draggedIndex = currentSortedCategories.findIndex(c => c.id === draggedId);
        const targetIndex = currentSortedCategories.findIndex(c => c.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const reordered = [...currentSortedCategories];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, draggedItem);
        
        const updatedCategoriesWithNewPosition = reordered.map((cat, index) => ({
            ...cat,
            position: index + 1,
        }));
        
        setCategories(updatedCategoriesWithNewPosition); // Optimistic UI update
        
        try {
            const updatePromises = updatedCategoriesWithNewPosition.map(cat => 
                updateDoc(doc(db, 'categories', cat.id.toString()), { position: cat.position })
            );
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Failed to update category positions:", error);
            setCategories(currentSortedCategories); // Revert on failure
            alert("Failed to save new order.");
        } finally {
            setDraggedId(null);
        }
    };


    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-dark-card p-4 rounded-xl border border-white/10 shadow-lg">
                <div className="w-full md:w-auto">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Icon name="layout-grid" className="text-brand-primary" />
                        Categories
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Manage , Edit And Delete Categorires</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0 md:w-64">
                        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search categories..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-brand-primary transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleCreate}
                        className="bg-brand-primary text-black hover:bg-brand-primary/90 transition-all px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 active:scale-95 whitespace-nowrap"
                    >
                        <Icon name="plus" size={18} />
                        <span className="hidden sm:inline">Add New</span>
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                        <div 
                            key={cat.id} 
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, cat.id)}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, cat.id)}
                            onDrop={(e) => handleDrop(e, cat.id)}
                            onDragEnd={handleDragEnd}
                            className={`group bg-dark-card rounded-2xl overflow-hidden border hover:border-brand-primary/40 shadow-lg hover:shadow-brand-primary/10 flex flex-col h-full relative cursor-move transition-all duration-300
                                ${dropTargetId === cat.id ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-dark-bg border-transparent' : 'border-white/5'}
                            `}
                        >
                            {/* Card Image */}
                            <div className="h-44 w-full relative overflow-hidden bg-black/50">
                                <MediaDisplay 
                                    src={cat.imageUrl} 
                                    alt={cat.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent opacity-80"></div>
                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                     <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-[10px] font-mono px-2 py-1 rounded border border-white/5">
                                        ID: {cat.id}
                                     </span>
                                     <span className="bg-black/60 backdrop-blur-sm text-brand-cyan text-[10px] font-mono px-2 py-1 rounded border border-white/5">
                                        POS: {cat.position}
                                     </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 flex flex-col flex-1 relative -mt-6" >
                                <div className="bg-dark-card border border-white/5 rounded-xl p-3 shadow-lg mb-4 flex-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors text-center truncate" title={cat.name}>
                                        {cat.name}
                                    </h3>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <button 
                                        onClick={() => handleEdit(cat)}
                                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-2.5 rounded-lg text-xs font-bold transition-all border border-white/5 hover:border-white/20"
                                    >
                                        <Icon name="edit-3" size={14} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => initiateDelete(cat.id)}
                                        className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 py-2.5 rounded-lg text-xs font-bold transition-all border border-red-500/10 hover:border-red-500/30"
                                    >
                                        <Icon name="trash-2" size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 opacity-60">
                        <div className="bg-dark-card p-6 rounded-full mb-4 border border-white/5 shadow-inner">
                             <Icon name="layout-grid" size={48} className="text-gray-600"/>
                        </div>
                        <h3 className="text-xl font-bold text-gray-300">No Categories Found</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">Try adjusting your search or add a new category to get started.</p>
                        <button 
                            onClick={handleCreate}
                            className="mt-6 text-brand-primary font-bold text-sm hover:underline flex items-center gap-2"
                        >
                            <Icon name="plus-circle" size={16} /> Create First Category
                        </button>
                    </div>
                )}
            </div>

            <CategoryModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={editingCategory}
                onSave={handleSave}
                categories={categories}
            />

            <ConfirmModal 
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Category"
                message="Are you sure you want to delete this category? All associated matches might lose their category tag."
                confirmText="Delete Category"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </div>
    );
};

export default AdminCategoriesScreen;