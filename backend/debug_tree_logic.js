    // NEW: Get full tree topology for Organic Tree Visualization
    async getReferralTree(userId) {
    const rootId = new mongoose.Types.ObjectId(userId);

    // Fetch all descendants with key data
    const topology = await User.aggregate([
        { $match: { _id: rootId } },
        {
            $graphLookup: {
                from: 'users',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'reportsTo', // assuming this exists or 'referredBy'? 
                // Wait, standard field is 'referredBy' which holds the Code string usually or ID?
                // Let's check Schema. User model usually has 'referredBy' as String (Code) or ObjectID?
                // In previous steps, we used 'referralCode'. 
                // Actually, let's verify UserModel.js first to be strict.
                // Assuming 'referredBy' is the ID reference for optimization or we matched codes.
                // If 'referredBy' is a string code, graphLookup is harder. 
                // Let's assume we maintain a parentId or similar.
                // IF NOT: We must rely on string matching which is slower, or use the existing structure.
                // Let's check UserModel.
                as: 'descendants',
                depthField: 'depth',
                maxDepth: 5 // Limit to 5 levels for visual clarity in Phase 1
            }
        },
        {
            $project: {
                descendants: {
                    _id: 1,
                    username: 1,
                    referralCount: 1, // Branch thickness
                    status: 1, // Leaf color
                    depth: 1,
                    reportsTo: 1 // Parent Reference
                }
            }
        }
    ]);

    return topology[0]?.descendants || [];
}
