"""aurora-xinput (build time): answer XInput ListInputDevices (minor opcode 2) with an empty device list.

Winlator's XInputExtension has no case for opcode 2, so it replies BadImplementation, and Roblox Studio
closes at startup. This adds a case that replies with zero devices (a valid XI 1.x reply).
Runs after setup-winlator.py has copied the upstream sources. Every anchor must occur exactly once,
otherwise NOTHING is written.
"""
from pathlib import Path

XI = Path('android/app/src/main/java/com/winlator/xserver/extensions/XInputExtension.java')
if not XI.is_file():
    raise SystemExit('Missing %s: run scripts/setup-winlator.py first' % XI)
s = XI.read_text(encoding='utf-8')
if 'aurora-xinput' in s:
    print('XInput ListInputDevices patch already applied')
    raise SystemExit(0)

EDITS = [
    ('        private static final byte QUERY_DEVICE = 48;',
     '        private static final byte QUERY_DEVICE = 48;\n        private static final byte LIST_INPUT_DEVICES = 2; // aurora-xinput'),
    ('            case ClientOpcodes.QUERY_DEVICE:',
     '            case ClientOpcodes.LIST_INPUT_DEVICES: // aurora-xinput\n                listInputDevices(client, inputStream, outputStream);\n                break;\n            case ClientOpcodes.QUERY_DEVICE:'),
    ('    private boolean isValidDeviceId(int deviceId) {',
     '''    private void listInputDevices(XClient client, XInputStream inputStream, XOutputStream outputStream) throws IOException, XRequestError {
        client.skipRequest(); // aurora-xinput

        try (XStreamLock lock = outputStream.lock()) {
            outputStream.writeByte(RESPONSE_CODE_SUCCESS);
            outputStream.writeByte((byte)0);
            outputStream.writeShort(client.getSequenceNumber());
            outputStream.writeInt(0);
            outputStream.writeByte((byte)0);
            outputStream.writePad(23);
        }
    }

    private boolean isValidDeviceId(int deviceId) {'''),
]
for old, _ in EDITS:
    n = s.count(old)
    if n != 1:
        raise SystemExit('XInputExtension.java: anchor found %d times (need exactly 1): %r' % (n, old[:60]))
for old, new in EDITS:
    s = s.replace(old, new)
XI.write_text(s, encoding='utf-8')
print('XInput ListInputDevices patch applied: opcode 2 answered with an empty device list')
