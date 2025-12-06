export function BuildRedeemableRewards(rawRewards, tier) {
    const grouped = {};
  
    for (const r of rawRewards) {
      const key = `${r.levelNumber}_${r.rewardMethod}`;
  
      if (!grouped[key]) {
        grouped[key] = {
          levelNumber: r.levelNumber,
          type: r.rewardMethod,
          isCollected: false, // ⭐ NEW
          earned: [],
          wheelItems: [],
        };
      }
  
      grouped[key].earned.push(r);

         // ⭐ If ANY reward inside this level is collected → mark whole group collected
    if (r.action === "REWARD_COLLECTED" || r.isCollected === true) {
        grouped[key].isCollected = true;
      }
    
    }
  
    // Attach wheel items ONLY for SPIN
    for (const key of Object.keys(grouped)) {
      const group = grouped[key];
  
      if (group.type === "SPIN") {
        const level = tier.levels.find(
          (lvl) => lvl.levelNumber === group.levelNumber
        );
  
        if (level) {
          group.wheelItems = level.rewards.map((rw) => ({
            id: rw._id.toString(),
            label: rw.label,
            value: rw.value,
            valueType: rw.valueType,
            image: rw.image,
            rewardType: rw.rewardType,
          }));
        }
      }
    }
  
    return Object.values(grouped);
  }
  