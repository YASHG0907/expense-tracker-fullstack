// ─── CALCULATE NET BALANCE PER MEMBER ─────────────────────
// members: [{ userId, name, sharePercentage }]
// expenses: [{ paidBy, amount }]
//
// Returns: [{ userId, name, paid, owed, net }]

const calculateBalances = (members, expenses) => {
  // Step 1: set up a balance record for every member, starting at zero
  const balanceMap = {};
  members.forEach((m) => {
    balanceMap[m.userId] = {
      userId: m.userId,
      name: m.name,
      paid: 0,
      owed: 0,
      net: 0,
    };
  });

  // Step 2: total amount spent across ALL expenses in this group
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Step 3: credit whoever actually paid for each expense
  expenses.forEach((e) => {
    const amount = parseFloat(e.amount);
    if (balanceMap[e.paidBy]) {
      balanceMap[e.paidBy].paid += amount;
    }
  });

  // Step 4: calculate what each member SHOULD have paid,
  // based on their share percentage of the total
  members.forEach((m) => {
    const shareFraction = m.sharePercentage / 100;
    balanceMap[m.userId].owed = totalSpent * shareFraction;
  });

  // Step 5: net balance = what they paid minus what they owed
  // Round to 2 decimal places to avoid floating point ugliness (1599.9999999)
  Object.values(balanceMap).forEach((b) => {
    b.paid = Math.round(b.paid * 100) / 100;
    b.owed = Math.round(b.owed * 100) / 100;
    b.net = Math.round((b.paid - b.owed) * 100) / 100;
  });

  return Object.values(balanceMap);
};

// ─── SIMPLIFY INTO MINIMUM TRANSACTIONS ───────────────────
// balances: [{ userId, name, net }]
// Returns: [{ fromUserId, from, toUserId, to, amount }]
//
// Greedy algorithm: repeatedly match the biggest creditor
// with the biggest debtor until everyone is settled.

const simplifySettlements = (balances) => {
  // Anyone owed money (net > 0), sorted biggest first
  // We use 0.01 instead of 0 to avoid floating point issues
  // like 0.0000000001 being treated as "still owes money"
  const creditors = balances
    .filter((b) => b.net > 0.01)
    .map((b) => ({ ...b })) // copy so we don't mutate the original
    .sort((a, b) => b.net - a.net);

  // Anyone who owes money (net < 0), converted to positive, sorted biggest first
  const debtors = balances
    .filter((b) => b.net < -0.01)
    .map((b) => ({ ...b, net: Math.abs(b.net) }))
    .sort((a, b) => b.net - a.net);

  const settlements = [];
  let i = 0; // pointer into creditors
  let j = 0; // pointer into debtors

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // The amount that changes hands is whichever is smaller —
    // you can't pay more than you owe, and you can't receive
    // more than you're owed
    const amount = Math.min(creditor.net, debtor.net);

    if (amount > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        from: debtor.name,
        toUserId: creditor.userId,
        to: creditor.name,
        amount: Math.round(amount * 100) / 100,
      });
    }

    creditor.net -= amount;
    debtor.net -= amount;

    // Move to the next creditor/debtor once current one is fully settled
    if (creditor.net < 0.01) i++;
    if (debtor.net < 0.01) j++;
  }

  return settlements;
};

module.exports = { calculateBalances, simplifySettlements };
