require('dotenv').config();
const FuelPrice = require('../models/FuelPrice')

async function fuelPricing() {

  const response = await fetch(
    "https://api.collectapi.com/gasPrice/allUsaPrice",
    { headers: { "Authorization": `apikey ${process.env.COLLECT_API_KEY}` } }
  );
  
  // Check if response is ok
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }
  
  const data = await response.json();
  
  // Transform array into object with state name as key
  const pricesObject = {};
  data.result.forEach(state => {
    pricesObject[state.name] = {
      currency: state.currency,
      regular: state.regular,
      midGrade: state.midGrade,
      premium: state.premium,
      diesel: state.diesel
    };
  });
  
  // Use findOneAndUpdate with upsert to create if doesn't exist, update if does
  await FuelPrice.findOneAndUpdate(
    {}, // Empty filter matches the single document (or creates if doesn't exist)
    { prices: pricesObject },
    { upsert: true, new: true }
  );
}

function calculateRoute(route, user, tractor, userCosts, logistics, driver, startAddress, pickupAddress,
  dropoffAddress, startDate) {

  const fixedCosts = {
    //Divide by average number of loads a month
    tractorLease: parseFloat(tractor.tractorLease / userCosts.loadsPerMonth),
    trailerLease: parseFloat(tractor.trailerLease / userCosts.loadsPerMonth),
    loan: parseFloat(userCosts.loan / userCosts.loadsPerMonth),
    insurance: parseFloat(tractor.insurance / userCosts.loadsPerMonth),
    overhead: parseFloat((logistics.revenue * userCosts.overhead / 100).toFixed(2)),
  }

  const otherCosts = {
    depreciation: parseFloat(((tractor.depreciation / 12) / userCosts.loadsPerMonth).toFixed(2)),
    parking: parseFloat(userCosts.parking / userCosts.loadsPerMonth),
    repairs: parseFloat((userCosts.repairs / 100) * (route.summary.distance.value / 1609.34))
  }

  //Operating
  const directCosts = {
    labor: parseFloat((logistics.revenue * userCosts.laborRate / 100).toFixed(2)),
    payrollTax: parseFloat((logistics.revenue * userCosts.payrollTax / 100).toFixed(2)),
    dispatch: parseFloat((logistics.revenue * userCosts.dispatch / 100).toFixed(2)),
    factor: parseFloat((logistics.revenue * userCosts.factor / 100).toFixed(2)),
    odc: parseFloat((logistics.revenue * userCosts.odc / 100).toFixed(2)),
    tolls: parseFloat(route.costs.minimumTollCost || 0),
    gasCost: parseFloat(route.costs.fuel)
  }

  const jobData = {
    start: startAddress,
    pickUp: pickupAddress,
    dropOff: dropoffAddress,
    date: startDate,
    revenue: parseFloat(logistics.revenue),
    distance: parseFloat((route.summary.distance.value / 1609.34).toFixed(2)),
    driveTime: route.summary.duration.text,
    client: logistics.client,
    driver: driver.name,
    tractor: tractor.internalNum,
    tractorLease: fixedCosts.tractorLease,
    trailerLease: fixedCosts.trailerLease,
    repairs: otherCosts.repairs,
    loan: fixedCosts.loan,
    parking: otherCosts.parking,
    labor: directCosts.labor,
    payrollTax: directCosts.payrollTax,
    dispatch: directCosts.dispatch,
    factor: directCosts.factor,
    odc: directCosts.odc,
    overhead: fixedCosts.overhead,
    gasCost: route.costs.fuel,
    tolls: route.costs.minimumTollCost || 0,
    ratePerMile: parseFloat((logistics.revenue / (route.summary.distance.value / 1609.34)).toFixed(2)),
    laborRatePercent: userCosts.laborRate,
    insurance: fixedCosts.insurance,
    depreciation: otherCosts.depreciation
  }

  if (user.accountType === 'driver') {
    jobData.admin = user.admin
  } else {
    jobData.admin = user.username
  }

  jobData.totalDirectCosts = Object.entries(directCosts)
    .reduce((sum, [_, value]) => parseFloat((sum + value).toFixed(2)), 0);

  jobData.totalFixedCost = Object.entries(fixedCosts)
    .reduce((sum, [_, value]) => parseFloat((sum + value).toFixed(2)), 0);

  jobData.totalOtherCosts = Object.entries(otherCosts)
    .reduce((sum, [_, value]) => parseFloat((sum + value).toFixed(2)), 0);

  jobData.grossProfit = parseFloat((logistics.revenue - jobData.totalDirectCosts).toFixed(2))
  jobData.operatingProfit = parseFloat((jobData.grossProfit - jobData.totalFixedCost).toFixed(2))

  jobData.grossProfitPercentage = parseFloat(((jobData.grossProfit / logistics.revenue) * 100).toFixed(2))
  jobData.operatingProfitPercentage = parseFloat(((jobData.operatingProfit / logistics.revenue) * 100).toFixed(2))

  jobData.totalCost = parseFloat(jobData.totalDirectCosts + jobData.totalFixedCost + jobData.totalOtherCosts)

  jobData.netProfit = parseFloat((logistics.revenue - jobData.totalCost).toFixed(2))

  jobData.netProfitPercentage = parseFloat(((jobData.netProfit / parseFloat(logistics.revenue)) * 100).toFixed(2))

  if (jobData.totalCost >= parseFloat(logistics.revenue)) {
    jobData.profitable = false
  } else {
    jobData.profitable = true
  }

  return jobData
}

module.exports = { calculateRoute, fuelPricing };