import "reflect-metadata";

import { AppDataSource } from "./data-source";
import { SeedService } from "./seed.service";

/**
 * Запуск: npm run seed
 * Спершу застосовуємо міграції, потім наповнюємо базу даними.
 */
async function main(): Promise<void> {
  const dataSource = await AppDataSource.initialize();

  try {
    await dataSource.runMigrations();
    const seed = new SeedService(dataSource);
    await seed.run();
    console.log("Seed finished");
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
