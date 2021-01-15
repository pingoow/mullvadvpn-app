import { app, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { IApplication } from '../shared/application-types';

const APPLICATION_PATHS = [
  `${process.env.ProgramData}/Microsoft/Windows/Start Menu/Programs`,
  `${process.env.AppData}/Microsoft/Windows/Start Menu/Programs`,
];

interface ShortcutDetails {
  target: string;
  name: string;
  args?: string;
}

// Finds applications by searching through the startmenu for shortcuts with and exe-file as target.
export async function getApplications(applicationPaths?: string[]): Promise<IApplication[]> {
  const links = await Promise.all(APPLICATION_PATHS.map(findAllLinks));
  let shortcuts = removeDuplicates(resolveLinks(links.flat()));

  if (applicationPaths) {
    const startMenuApplications = shortcuts.filter((shortcut) =>
      applicationPaths.includes(shortcut.target),
    );

    const nonStartMenuApplications = applicationPaths
      .filter(
        (applicationPath) => !shortcuts.some((shortcut) => shortcut.target === applicationPath),
      )
      .map((applicationPath) => ({
        target: applicationPath,
        name: path.basename(applicationPath),
      }));

    shortcuts = [...startMenuApplications, ...nonStartMenuApplications];
  }

  const sortedShortcuts = shortcuts.sort((a, b) => a.name.localeCompare(b.name));
  return convertToSplitTunnelingApplications(sortedShortcuts);
}

async function findAllLinks(path: string): Promise<string[]> {
  if (path.endsWith('.lnk')) {
    return [path];
  } else {
    const stat = await fs.promises.stat(path);
    if (stat.isDirectory()) {
      const contents = await fs.promises.readdir(path);
      const result = await Promise.all(contents.map((item) => findAllLinks(`${path}/${item}`)));
      return result.flat();
    } else {
      return [];
    }
  }
}

function resolveLinks(linkPaths: string[]): ShortcutDetails[] {
  return linkPaths
    .map((link) => {
      try {
        return {
          ...shell.readShortcutLink(path.resolve(link)),
          name: path.parse(link).name,
        };
      } catch (_e) {
        return null;
      }
    })
    .filter(
      (shortcut): shortcut is ShortcutDetails =>
        shortcut !== null &&
        shortcut.name !== 'Mullvad VPN' &&
        shortcut.target.endsWith('.exe') &&
        !shortcut.target.toLowerCase().includes('uninstall') &&
        !shortcut.name.toLowerCase().includes('uninstall'),
    );
}

function removeDuplicates(shortcuts: ShortcutDetails[]): ShortcutDetails[] {
  const unique = shortcuts.reduce((shortcuts, shortcut) => {
    if (shortcuts[shortcut.target]) {
      if (
        shortcuts[shortcut.target].args &&
        shortcuts[shortcut.target].args !== '' &&
        (!shortcut.args || shortcut.args === '')
      ) {
        shortcuts[shortcut.target] = shortcut;
      }
    } else {
      shortcuts[shortcut.target] = shortcut;
    }
    return shortcuts;
  }, {} as Record<string, ShortcutDetails>);

  return Object.values(unique);
}

function convertToSplitTunnelingApplications(
  shortcuts: ShortcutDetails[],
): Promise<IApplication[]> {
  return Promise.all(
    shortcuts.map(async (shortcut) => {
      return {
        absolutepath: shortcut.target,
        name: shortcut.name,
        icon: await retrieveIcon(shortcut.target),
      };
    }),
  );
}

async function retrieveIcon(exe: string) {
  const icon = await app.getFileIcon(exe);
  return icon.toDataURL();
}
