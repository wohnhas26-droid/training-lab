/**
 * Registers traininglab:// on Capacitor Android/iOS projects when they exist.
 * android/ and ios/ are gitignored — run after `npx cap add android|ios`.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEME = process.env.APP_DEEP_LINK_SCHEME || 'traininglab';

const ANDROID_FILTER = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="${SCHEME}" />
            </intent-filter>`;

function patchAndroid() {
  const manifestPath = join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!existsSync(manifestPath)) {
    console.log('Android project not present — skip deep link intent filter');
    return;
  }
  const xml = readFileSync(manifestPath, 'utf8');
  if (xml.includes(`android:scheme="${SCHEME}"`)) {
    console.log(`Android already registers ${SCHEME}://`);
    return;
  }
  if (!xml.includes('</activity>')) {
    console.warn('AndroidManifest.xml has no </activity> — skip');
    return;
  }
  writeFileSync(manifestPath, xml.replace('</activity>', `${ANDROID_FILTER}\n        </activity>`));
  console.log(`Added ${SCHEME}:// intent filter to AndroidManifest.xml`);
}

function patchIos() {
  const plistPath = join(root, 'ios', 'App', 'App', 'Info.plist');
  if (!existsSync(plistPath)) {
    console.log('iOS project not present — skip URL types');
    return;
  }
  const plist = readFileSync(plistPath, 'utf8');
  if (plist.includes(`<string>${SCHEME}</string>`)) {
    console.log(`iOS already registers ${SCHEME}://`);
    return;
  }
  const block = `	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>com.futboltraininglab.app</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>${SCHEME}</string>
			</array>
		</dict>
	</array>
`;
  if (!plist.includes('</dict>\n</plist>') && !plist.includes('</dict>\r\n</plist>')) {
    console.warn('Info.plist format unexpected — skip');
    return;
  }
  writeFileSync(plistPath, plist.replace(/<\/dict>\r?\n<\/plist>/, `${block}</dict>\n</plist>`));
  console.log(`Added ${SCHEME}:// to iOS CFBundleURLTypes`);
}

patchAndroid();
patchIos();
