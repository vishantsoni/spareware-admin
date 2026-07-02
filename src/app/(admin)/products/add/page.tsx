"use client";

import React, { useMemo, useState, useEffect } from 'react';
import serverCallFuction from '@/lib/constantFunction';

import Form from '@/components/form/Form';
import InputField from '@/components/form/input/InputField';
import TextAreaInput from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import DropZone from '@/components/form/DropZone';
import { Plus, Trash } from 'lucide-react';
import Badge from '@/components/ui/badge/Badge';

interface Variant {
    _id: string;
    variant_name: string;
}

interface YearItem {
    _id: string;
    year_val: number;
    variants: Variant[];
}

interface SubItem {
    _id: string;
    model_name: string;
    years: YearItem[];
}

interface CategoryData {
    _id: string;
    cat_name: string;
    sub_items: SubItem[];
}

// Fixed type signature for backend payloads
type PPriceItem = { name: string; value: string; inventory: string };

type CreateProductPayload = {
    cat_id: string;
    p_name: string;
    brand?: string;
    unit_name: string;
    unit_value: number;
    m_o_q: number;
    model_name: string;
    year_val: number;
    variant_name: string;
    p_sku: string;
    location: string;
    inventory: number;
    hide_inventory: boolean;
    visibility: boolean;
    accept_order: string;
    product_type?: string;
    price?: number;
    p_gallery_video?: string;
    description: string;
    p_price?: PPriceItem[];
    part_number: string;
    short_description: string;
    features: {
        specification: {
            country_of_origin: string;
            manufacturer_address: string;
            oem_part_no: string;
            net_quantity: string;
        };
    };
};

const parseNumber = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim().length > 0) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
};

const ProductAddPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [images, setImages] = useState<File[]>([]);

    const onFilesChange = (files: File[]) => {
        setImages((prev) => [...prev, ...files]);
    };

    const removeImageAt = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Dynamic state management for pricing attributes rows loop
    const [pPrices, setPPrices] = useState<PPriceItem[]>([]);

    const [form, setForm] = useState({
        cat_id: '',
        p_name: '',
        brand: '',
        unit_name: '',
        unit_value: '',
        pkg: '',
        pkg_unit: '',
        mpkg: '',
        mpkg_unit: '',
        m_o_q: '',
        model_name: '',
        year_val: '',
        variant_name: '',
        p_sku: '',
        location: '',
        inventory: '',
        hide_inventory: false,
        visibility: false,
        accept_order: '',
        product_type: '',
        price: '',
        p_gallery_video: '',
        description: '',
        p_gallery_image: '',
        part_number: '',
        short_description: '',
        country_of_origin: '',
        manufacturer_address: '',
        oem_part_no: '',
        net_quantity: '',
    });

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await serverCallFuction<{ status: string; data: CategoryData[] }>(
                    'GET',
                    'api/category/getCategory'
                );
                const status = (res as any)?.status;
                const data = (res as any)?.data;

                if (status === 'success') {
                    setCategories(data || []);
                } else {
                    setError('Failed to fetch categories schema lists.');
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Error pulling categories dynamic attributes.';
                setError(msg);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    const selectedCategoryObj = useMemo(() => categories.find(c => c._id === form.cat_id) || null, [categories, form.cat_id]);
    const availableModels = useMemo(() => selectedCategoryObj ? selectedCategoryObj.sub_items : [], [selectedCategoryObj]);
    const selectedModelObj = useMemo(() => availableModels.find(m => m.model_name === form.model_name) || null, [availableModels, form.model_name]);
    const availableYears = useMemo(() => selectedModelObj ? selectedModelObj.years : [], [selectedModelObj]);
    const selectedYearObj = useMemo(() => availableYears.find(y => String(y.year_val) === form.year_val) || null, [availableYears, form.year_val]);
    const availableVariants = useMemo(() => selectedYearObj ? selectedYearObj.variants : [], [selectedYearObj]);

    const canSubmit = useMemo(() => {
        return form.cat_id.trim().length > 0 && form.p_name.trim().length >= 2 && form.unit_name.trim().length >= 1 && form.location.trim().length >= 3;
    }, [form]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, cat_id: e.target.value, model_name: '', year_val: '', variant_name: '' }));
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, model_name: e.target.value, year_val: '', variant_name: '' }));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, year_val: e.target.value, variant_name: '' }));
    };

    const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const updateTextArea = (key: keyof typeof form) => (value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const toggleBoolean = (key: 'hide_inventory' | 'visibility') => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.checked }));
    };

    // --- Dynamic P Price Actions handlers ---
    const addPPriceRow = () => {
        setPPrices(prev => [...prev, { name: '', value: '', inventory: '' }]);
    };

    const removePPriceRow = (index: number) => {
        setPPrices(prev => prev.filter((_, i) => i !== index));
    };

    const handlePPriceChange = (index: number, key: keyof PPriceItem, val: string) => {
        setPPrices(prev => prev.map((item, i) => i === index ? { ...item, [key]: val } : item));
    };

    const validateClientSide = (): { ok: true; payload?: CreateProductPayload } | { ok: false; msg: string } => {
        const errors: string[] = [];

        if (!form.cat_id) errors.push('Category is required');
        if (!form.p_name || form.p_name.trim().length < 2) errors.push('p_name must be at least 2 characters');
        if (!form.unit_name || form.unit_name.trim().length < 1) errors.push('unit_name is required');
        if (!form.part_number || form.part_number.trim().length === 0) errors.push('part_number is required');
        if (!form.short_description || form.short_description.trim().length === 0) errors.push('short_description is required');
        if (!form.country_of_origin || form.country_of_origin.trim().length === 0) errors.push('Country of origin is required');
        if (!form.manufacturer_address || form.manufacturer_address.trim().length === 0) errors.push('Manufacturer address is required');
        if (!form.oem_part_no || form.oem_part_no.trim().length === 0) errors.push('OEM part no is required');
        if (!form.net_quantity || form.net_quantity.trim().length === 0) errors.push('Net quantity is required');
        if (!form.model_name) errors.push('Model Name is required');
        if (!form.year_val) errors.push('Year selection parameter is required');
        if (!form.variant_name) errors.push('Variant setup selector is required');
        if (!form.location || form.location.trim().length < 3) errors.push('location must be at least 3 characters');
        if (!form.p_sku || form.p_sku.trim().length === 0) errors.push('p_sku is required');
        if (!form.accept_order || form.accept_order.trim().length === 0) errors.push('accept_order is required');
        if (!form.description || form.description.trim().length === 0) errors.push('description is required');

        const unitValue = parseNumber(form.unit_value);
        if (unitValue === null) errors.push('unit_value must be a valid number');

        const yearVal = parseNumber(form.year_val);
        if (yearVal === null) errors.push('year_val must be a valid number');

        const m_o_q = parseNumber(form.m_o_q);
        if (m_o_q === null) errors.push('m_o_q must be a valid number');

        const inventory = parseNumber(form.inventory);
        if (inventory === null) errors.push('inventory must be a valid number');

        if (errors.length > 0) {
            return { ok: false, msg: errors.join(', ') };
        }

        // Filter out completely empty client-added layout attributes rows if any exist before delivery
        const filteredPPrices = pPrices
            .map(p => ({ name: p.name.trim(), value: p.value.trim(), inventory: p.inventory.trim() }))
            .filter(p => p.name.length > 0 || p.value.length > 0 || p.inventory.length > 0);

        const payload: CreateProductPayload = {
            cat_id: form.cat_id.trim(),
            p_name: form.p_name.trim(),
            brand: form.brand.trim().length > 0 ? form.brand.trim() : undefined,
            unit_name: form.unit_name.trim(),
            unit_value: unitValue as number,
            m_o_q: m_o_q as number,
            model_name: form.model_name.trim(),
            year_val: yearVal as number,
            variant_name: form.variant_name.trim(),
            p_sku: form.p_sku.trim(),
            location: form.location.trim(),
            inventory: inventory as number,
            hide_inventory: form.hide_inventory,
            visibility: form.visibility,
            accept_order: form.accept_order.trim(),
            product_type: form.product_type.trim().length > 0 ? form.product_type.trim() : undefined,
            price: parseNumber(form.price) ?? undefined,
            p_gallery_video: form.p_gallery_video.trim().length > 0 ? form.p_gallery_video.trim() : undefined,
            description: form.description.trim(),
            p_price: filteredPPrices.length > 0 ? filteredPPrices : undefined,
            part_number: form.part_number.trim(),
            short_description: form.short_description.trim(),
            features: {
                specification: {
                    country_of_origin: form.country_of_origin.trim(),
                    manufacturer_address: form.manufacturer_address.trim(),
                    oem_part_no: form.oem_part_no.trim(),
                    net_quantity: form.net_quantity.trim(),
                },
            },
        };

        return { ok: true, payload };
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const validated = validateClientSide();
        if (!validated.ok) {
            setError(validated.msg);
            return;
        }

        if (!canSubmit) {
            setError('Please fill all required fields.');
            return;
        }

        setLoading(true);
        try {
            const payload = validated.payload as CreateProductPayload;
            const res = await serverCallFuction<unknown>('POST', 'api/product/createProduct', payload);

            const resObj = res as any;

            if (!resObj || resObj.status === false || resObj.status === 'Failed') {
                const msg = resObj?.msg || resObj?.message || 'Failed to create product';
                setError(msg);
                return;
            }

            const createdId = resObj?.data?._id;
            setSuccess('Product has been created successfully!');

            if (createdId && images.length > 0) {
                const formData = new FormData();
                images.forEach((file) => formData.append('file', file));

                const uploadRes = await serverCallFuction<unknown>(
                    'POST',
                    `api/product/uploadProductImage/${createdId}`,
                    formData
                );

                const uploadObj = uploadRes as any;

                if (!uploadObj || uploadObj.status === false || uploadObj.status === 'Failed') {
                    setError(uploadObj?.msg || 'Failed uploading assets');
                    return;
                }
                setSuccess('Product created and gallery assets attached!');
                setTimeout(() => {
                    navigation.navigate('/products')
                }, 2000);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to execute production cycle step.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };



    const selectClassName = "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 disabled:bg-gray-100 dark:border-white/[0.15] dark:text-white";

    return (
        <div className="p-6">
            <div className="mb-4">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Add Product</h1>
            </div>

            <Form onSubmit={onSubmit}>
                {/* 1. Category Fields Group */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <Label>Category *</Label>
                            <select value={form.cat_id} onChange={handleCategoryChange} className={selectClassName} disabled={loadingCategories}>
                                <option value="">{loadingCategories ? "Loading..." : "Select Category"}</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.cat_name}</option>)}
                            </select>
                        </div>

                        <div>
                            <Label>Model Name *</Label>
                            <select value={form.model_name} onChange={handleModelChange} className={selectClassName} disabled={!form.cat_id}>
                                <option value="">Select Model</option>
                                {availableModels.map((m, idx) => <option key={m._id || idx} value={m.model_name}>{m.model_name}</option>)}
                            </select>
                        </div>

                        <div>
                            <Label>Year *</Label>
                            <select value={form.year_val} onChange={handleYearChange} className={selectClassName} disabled={!form.model_name}>
                                <option value="">Select Year</option>
                                {availableYears.map((y, idx) => <option key={y._id || idx} value={y.year_val}>{y.year_val}</option>)}
                            </select>
                        </div>

                        <div>
                            <Label>Variant Name *</Label>
                            <select value={form.variant_name} onChange={update('variant_name')} className={selectClassName} disabled={!form.year_val}>
                                <option value="">Select Variant</option>
                                {availableVariants.map((v, idx) => <option key={v._id || idx} value={v.variant_name}>{v.variant_name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Core Product Parameters */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] mt-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <Label>Product Name *</Label>
                            <InputField type="text" value={form.p_name} onChange={update('p_name')} placeholder="Enter product name (min 2)" />
                        </div>
                        <div>
                            <Label>Brand</Label>
                            <InputField type="text" value={form.brand} onChange={update('brand')} placeholder="BrandX" />
                        </div>
                        <div>
                            <Label>Product Type (optional)</Label>
                            <InputField type="text" value={form.product_type} onChange={update('product_type')} placeholder="warehouse / published / ..." />
                        </div>
                        <div>
                            <Label>Unit Name *</Label>
                            <InputField type="text" value={form.unit_name} onChange={update('unit_name')} placeholder="pcs / unit / ..." />
                        </div>
                        <div>
                            <Label>Unit Value *</Label>
                            <InputField type="number" value={form.unit_value} onChange={update('unit_value')} placeholder="Enter unit value" />
                        </div>
                        <div>
                            <Label>SKU (p_sku) *</Label>
                            <InputField type="text" value={form.p_sku} onChange={update('p_sku')} placeholder="Unique SKU" />
                        </div>
                        <div>
                            <Label>Location *</Label>
                            <InputField type="text" value={form.location} onChange={update('location')} placeholder="Warehouse A" />
                        </div>
                        <div>
                            <Label>Inventory *</Label>
                            <InputField type="number" value={form.inventory} onChange={update('inventory')} placeholder="Enter inventory" />
                        </div>
                    </div>
                </div>

                {/* 3. Operational Requirements Info */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] mt-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <Label>MOQ (m_o_q) *</Label>
                            <InputField type="number" value={form.m_o_q} onChange={update('m_o_q')} placeholder="Enter MOQ" />
                        </div>
                        <div>
                            <Label>Accept Order *</Label>
                            <InputField type="text" value={form.accept_order} onChange={update('accept_order')} placeholder="yes / no / ..." />
                        </div>
                        <div>
                            <Label>part_number *</Label>
                            <InputField type="text" value={form.part_number} onChange={update('part_number')} placeholder="Enter part number" />
                        </div>
                        <div>
                            <Label>short_description *</Label>
                            <InputField type="text" value={form.short_description} onChange={update('short_description')} placeholder="Enter short description" />
                        </div>
                    </div>
                </div>

                {/* 4. Specifications Schema Meta */}
                <div className='mt-3 mb-1 font-medium text-sm text-gray-700 dark:text-gray-300'>Specification</div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                            <Label>Country of origin *</Label>
                            <InputField type="text" value={form.country_of_origin} onChange={update('country_of_origin')} placeholder="e.g. India" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label>Manufacturer address *</Label>
                            <InputField type="text" value={form.manufacturer_address} onChange={update('manufacturer_address')} placeholder="Enter manufacturer address" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label>OEM part no *</Label>
                            <InputField type="text" value={form.oem_part_no} onChange={update('oem_part_no')} placeholder="Enter OEM part no" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label>Net quantity *</Label>
                            <InputField type="text" value={form.net_quantity} onChange={update('net_quantity')} placeholder="Enter net quantity" />
                        </div>
                    </div>
                </div>

                {/* 5. Visibility Options */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] mt-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <Label>Visibility *</Label>
                            <div className="mt-1 flex items-center gap-3">
                                <input type="checkbox" checked={form.visibility} onChange={toggleBoolean('visibility')} />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Shown in product list</span>
                            </div>
                        </div>
                        <div>
                            <Label>Hide Inventory *</Label>
                            <div className="mt-1 flex items-center gap-3">
                                <input type="checkbox" checked={form.hide_inventory} onChange={toggleBoolean('hide_inventory')} />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Don’t show out-of-stock</span>
                            </div>
                        </div>
                        <div>
                            <Label>Price (optional)</Label>
                            <InputField type="number" value={form.price} onChange={update('price')} placeholder="Optional" />
                        </div>
                        <div>
                            <Label>Product Gallery Video (optional)</Label>
                            <InputField type="text" value={form.p_gallery_video} onChange={update('p_gallery_video')} placeholder="URL / link" />
                        </div>
                        <div className="sm:col-span-4">
                            <Label>Description *</Label>
                            <TextAreaInput value={form.description} onChange={updateTextArea('description')} placeholder="Product description..." />
                        </div>
                    </div>
                </div>

                {/* --- Dynamic Per Pcs Pricing Loops Area (p_price) --- */}
                <div className='mt-4 mb-2 flex justify-between items-center'>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">P Price Attributes Setup</span>
                    <button
                        type="button"
                        onClick={addPPriceRow}
                        className="cursor-pointer inline-flex items-center justify-center p-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {pPrices.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-white/[0.15]">
                        No dynamic pricing attributes added yet. Click the <b className="text-brand-500 font-medium">+</b> button to add dynamic attributes tracking row configurations.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pPrices.map((row, index) => (
                            <div
                                key={index}
                                className="relative rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]"
                            >
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
                                    <div>
                                        <Label>Name (optional)</Label>
                                        <InputField
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => handlePPriceChange(index, 'name', e.target.value)}
                                            placeholder="e.g. MPKG / PKG"
                                        />
                                    </div>
                                    <div>
                                        <Label>Price (optional)</Label>
                                        <InputField
                                            type="text"
                                            value={row.value}
                                            onChange={(e) => handlePPriceChange(index, 'value', e.target.value)}
                                            placeholder="e.g. 120"
                                        />
                                    </div>
                                    <div>
                                        <Label>Inventory (optional)</Label>
                                        <InputField
                                            type="text"
                                            value={row.inventory}
                                            onChange={(e) => handlePPriceChange(index, 'inventory', e.target.value)}
                                            placeholder="e.g. 10"
                                        />
                                    </div>
                                    <div className="flex justify-start sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removePPriceRow(index)}
                                            className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 transition-colors"
                                            title="Delete Row"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 7. Image Asset Management Area */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] mt-3">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="sm:col-span-2">
                            <Label>Gallery Images (optional)</Label>
                            <DropZone
                                multiple={true}
                                maxFiles={10}
                                maxSize={5}
                                onFilesChange={onFilesChange}
                                label="Drag & drop gallery images here, or click to select"
                                accept={{ 'image/png': [], 'image/jpeg': [], 'image/webp': [], 'image/svg+xml': [] }}
                            />
                            {images.length > 0 && (
                                <div className="mt-3">
                                    <div className="text-sm text-gray-600">Selected: {images.length} image(s)</div>
                                    <div className="mt-2 grid grid-cols-6 gap-3">
                                        {images.map((file, index) => (
                                            <div key={index} className="relative">
                                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full rounded-lg object-cover border border-gray-200" />
                                                <button type="button" onClick={() => removeImageAt(index)} className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
                {success && <div className="mt-4 text-sm text-green-500">{success}</div>}

                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-11 inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-medium text-white shadow-theme-xs disabled:opacity-60 hover:bg-brand-600 transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </Form>
        </div>
    );
};

export default ProductAddPage;