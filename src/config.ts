import type { AppConfig } from "@models/app-config";

// TODO: use NODE_ENV to change config values depending on prod/dev/test.

const config: AppConfig = {
    minShares: 20,
    shareDistribution: [
        {
            minPrice: 3.0,
            maxPrice: 10.0,
            quantity: 95
        },
        {
            minPrice: 10.0,
            maxPrice: 25.0,
            quantity: 3
        },
        {
            minPrice: 25.0,
            maxPrice: 200.0,
            quantity: 2
        },
    ]
}
export default config;
