/**
 * Man2Man UI Utilities
 * [PRO COMPATIBILITY]
 */

/**
 * Robust Copy-to-Clipboard function
 * Works on HTTPS, HTTP (via fallback), and mobile browsers.
 */
export const copyToClipboard = async (text) => {
    if (!text) return false;

    // Try modern API first (requires secure context/HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Modern clipboard fail, falling back:', err);
        }
    }

    // Fallback: Invisible Textarea method (Works on raw IP/non-HTTPS and older browsers)
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Prevent scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Fallback clipboard fail:', err);
        return false;
    }
};
