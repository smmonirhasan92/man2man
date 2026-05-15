
import os

file_path = '/var/www/man2man/backend/modules/user/UserModel.js'
with open(file_path, 'r') as f:
    content = f.read()

new_fields = """
    // --- Referral Empire 2.0 (Gamified) ---
    referralEmpire: {
        sharesCount: { type: Number, default: 0 },
        lastShareDate: { type: Date },
        isShareBonusClaimed: { type: Boolean, default: false },
        isJoinBonusClaimed: { type: Boolean, default: false },
        holdBalance: { type: Number, default: 0.00 } // Amount waiting for admin release
    },
"""

if 'referralEmpire:' not in content:
    target = 'isReferralBonusPaid: { type: Boolean, default: false },'
    if target in content:
        new_content = content.replace(target, new_fields + "    " + target)
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Successfully injected Empire fields into UserModel.")
    else:
        print("Target injection point not found.")
else:
    print("Empire fields already exist.")
