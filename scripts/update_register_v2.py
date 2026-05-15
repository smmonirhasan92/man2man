
import os

file_path = '/var/www/man2man/frontend/app/register/page.js'
with open(file_path, 'r') as f:
    content = f.read()

# Using a simplified search to avoid escape issues
target_start = 'useEffect(() => {'
target_end = '}, [refCodeFromUrl]);'

# Find the block containing refCodeFromUrl
start_idx = content.find('useEffect(() => {\n        if (refCodeFromUrl)')
if start_idx != -1:
    end_idx = content.find('}, [refCodeFromUrl]);', start_idx) + len('}, [refCodeFromUrl]);')
    
    new_block = """    useEffect(() => {
        // 1. Priority: URL Ref Code
        if (refCodeFromUrl) {
            setFormData(prev => ({ ...prev, referralCode: refCodeFromUrl }));
        } else {
            // 2. Secondary: IP Handshake (Auto-fill Magic)
            const checkHandshake = async () => {
                try {
                    const res = await api.get('/referral/handshake');
                    if (res.data.referralCode) {
                        setFormData(prev => ({ ...prev, referralCode: res.data.referralCode }));
                    }
                } catch (e) {
                    console.log("Handshake skip");
                }
            };
            checkHandshake();
        }

        const loadFingerprint = async () => {
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                setFormData(prev => ({ ...prev, deviceId: result.visitorId }));
            } catch (error) { console.error(error); }
        };
        loadFingerprint();
    }, [refCodeFromUrl]);"""
    
    new_content = content[:start_idx] + new_block + content[end_idx:]
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully integrated IP Handshake into Register page.")
else:
    print("Target block not found.")
