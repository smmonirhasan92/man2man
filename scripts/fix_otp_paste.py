
import sys
import re

file_path = '/var/www/man2man/frontend/app/register/page.js'
content = open(file_path).read()

new_block = """                                    <div className="flex justify-between gap-2 max-w-[320px] mx-auto">
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                maxLength={1}
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                value={userOtp[index] || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\\D/g, '');
                                                    if (val) {
                                                        const newOtp = userOtp.split('');
                                                        newOtp[index] = val;
                                                        const combined = newOtp.join('');
                                                        setUserOtp(combined);
                                                        // Move focus to next
                                                        if (index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Backspace' && !userOtp[index] && index > 0) {
                                                        document.getElementById(`otp-${index - 1}`)?.focus();
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    e.preventDefault();
                                                    const pasteData = e.clipboardData.getData('text').replace(/\\D/g, '').slice(0, 6);
                                                    if (pasteData) {
                                                        setUserOtp(pasteData);
                                                        const nextIdx = Math.min(pasteData.length, 5);
                                                        setTimeout(() => {
                                                            const nextEl = document.getElementById(`otp-${nextIdx}`);
                                                            if (nextEl) nextEl.focus();
                                                        }, 10);
                                                    }
                                                }}
                                                className="w-12 h-14 bg-[#0a1120] border border-white/10 rounded-xl text-center text-white font-mono text-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner outline-none"
                                            />
                                        ))}
                                    </div>"""

# Match the old block
pattern = r'<div className="flex justify-between gap-2 max-w-\[320px\] mx-auto">.*?</div>'

if re.search(pattern, content, re.DOTALL):
    print("Found pattern, replacing...")
    new_content = re.sub(pattern, new_block, content, flags=re.DOTALL)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print("Pattern not found.")
