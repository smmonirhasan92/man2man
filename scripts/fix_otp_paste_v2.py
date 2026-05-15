
import sys

file_path = '/var/www/man2man/frontend/app/register/page.js'
content = open(file_path).read()

# I'll use unique landmarks to find the block
start_marker = '<div className="flex justify-between gap-2 max-w-[320px] mx-auto">'
end_marker = '                                    </div>'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found")
    sys.exit(1)

# Find the specific end marker after the start marker
# We look for the first </div> after the inputs mapping
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("End marker not found")
    sys.exit(1)

# Include the end marker itself
end_idx += len(end_marker)

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
                                                            const el = document.getElementById(`otp-${nextIdx}`);
                                                            if (el) el.focus();
                                                        }, 10);
                                                    }
                                                }}
                                                className="w-12 h-14 bg-[#0a1120] border border-white/10 rounded-xl text-center text-white font-mono text-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner outline-none"
                                            />
                                        ))}
                                    </div>"""

new_content = content[:start_idx] + new_block + content[end_idx:]

with open(file_path, 'w') as f:
    f.write(new_content)

print("Successfully replaced.")
