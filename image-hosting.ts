// A valid API key for a free image hosting service (imgbb.com)
const IMGBB_API_KEY = '503e404322b7af96756e559c0401bc0d';

/**
 * Uploads a Base64 encoded media asset to a third-party hosting service.
 * This is used for non-critical, large assets like fallback images and banners.
 * @param base64Data The Base64 data URL (e.g., "data:image/jpeg;base64,...").
 * @returns A promise that resolves with the public URL of the uploaded file.
 */
export const uploadMediaAsset = async (base64Data: string): Promise<string> => {
    // The API expects the base64 string without the "data:..." prefix.
    const base64String = base64Data.split(',')[1];
    if (!base64String) {
        throw new Error("Invalid Base64 data provided.");
    }

    const formData = new FormData();
    formData.append('image', base64String);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`External storage upload failed: ${errorData?.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();

    if (result.success && result.data?.url) {
        // Prioritize medium-sized images for faster loading, fallback to original.
        // GIFs won't have a medium version, so this safely falls back.
        return result.data.medium?.url || result.data.url;
    } else {
        throw new Error('External storage service did not return a valid URL.');
    }
};
