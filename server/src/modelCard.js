export const MODEL_CARD = {
  name: "LightGBM",
  algorithm: "Gradient boosting decision trees",
  target: "log(1 + next-day violations) per 1.2 km cell",
  cells: 802,
  days: 151,
  records: "298,000",
  rocAuc: 0.945,
  precisionAt20: 0.61,
  folds: 3,
  features: [
    "lags at 1, 2, 3, 7 and 14 days",
    "rolling mean and volatility over 3, 7 and 14 days",
    "trend versus the same weekday last week",
    "each cell's historical average",
    "each cell's average on this weekday",
  ],
  shippedFeatureSet: "lean set, low-importance features dropped",
  validation: "3 rolling two-week folds, train on the past and test on the future",
}

export const FREIGHT_SHARE = 0.75
export const SMALL_SAMPLE = 50
export const DEFAULT_FREIGHT_WEIGHT = 0.4
