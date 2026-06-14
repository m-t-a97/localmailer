#!/usr/bin/node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const dopplerConfigFileTemplate = (project: string, config: string) => {
  return ["setup:", `  project: ${project}`, `  config: ${config}`].join("\n");
};

// Helper to run shell commands asynchronously
const execCommand = async (
  command: string,
  currentWorkingDirectory: string
) => {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("bash", ["-c", command], {
      cwd: currentWorkingDirectory,
      stdio: "overlapped",
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on("error", (error) => reject(error));
  });
};

async function setDopplerConfigs(config: any) {
  const items = [
    {
      folderName: "webapp",
      projectName: "webapp",
    },
  ];

  const setupTasks = items.map(async (item) => {
    console.log(item);

    let selectedConfig = config;
    const projectDir = `apps/${item.folderName}`;

    // Check if the directory exists
    if (!existsSync(projectDir)) {
      console.error(`Directory ${projectDir} does not exist.`);
      return;
    }

    try {
      const dopplerConfig = dopplerConfigFileTemplate(
        item.projectName,
        selectedConfig
      );

      const command = [
        `echo "${dopplerConfig}" > doppler.yaml`,
        "doppler setup --no-interactive",
      ].join("; ");

      console.log(`Setting up Doppler config in ${projectDir}...`);

      // Run the command asynchronously
      await execCommand(command, projectDir);

      console.log(`Doppler setup completed for ${item.folderName}`);
    } catch (error: any) {
      console.error(
        `Error setting up Doppler config for ${item.folderName}: ${error.message}`
      );
    }
  });

  await Promise.all(setupTasks);
}

if (process.argv.length < 3) {
  console.error(
    "You must specify a Doppler config value (e.g., dev, stage, or prod)."
  );
  process.exit(1);
} else {
  const config = process.argv[2];
  setDopplerConfigs(config)
    .then(() => {
      console.log("All Doppler setups completed.");
    })
    .catch((error) => {
      console.error(
        "Error in setting up Doppler configurations:",
        error.message
      );
    });
}
