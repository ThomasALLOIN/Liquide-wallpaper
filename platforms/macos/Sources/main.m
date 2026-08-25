#import <Cocoa/Cocoa.h>
#import <CoreGraphics/CoreGraphics.h>
#import <WebKit/WebKit.h>
#import <os/log.h>

static const CGFloat WallpaperWidth = 1470.0;
static const CGFloat WallpaperHeight = 956.0;
static const CGFloat LauncherSize = 38.0;
static const CGFloat LauncherLeftInset = 16.0;
static const CGFloat LauncherTopInset = 38.0;

static NSImage *LiquideStatusIcon(void) {
    const CGFloat size = 18.0;
    NSImage *image = [[NSImage alloc] initWithSize:NSMakeSize(size, size)];
    [image lockFocus];

    [[NSColor blackColor] setStroke];
    NSBezierPath *outline = [NSBezierPath bezierPathWithOvalInRect:NSMakeRect(2.0, 2.0, 14.0, 14.0)];
    outline.lineWidth = 1.45;
    [outline stroke];

    // Veine maîtresse : la séparation organique jour/nuit du marbre.
    NSBezierPath *mainVein = [NSBezierPath bezierPath];
    [mainVein moveToPoint:NSMakePoint(4.2, 3.8)];
    [mainVein curveToPoint:NSMakePoint(13.8, 14.2)
             controlPoint1:NSMakePoint(7.1, 6.2)
             controlPoint2:NSMakePoint(10.7, 12.3)];
    mainVein.lineWidth = 1.55;
    [mainVein stroke];

    // Deux fragments ouverts rendent la matière lisible sans surcharger la barre de menus.
    NSBezierPath *upperVein = [NSBezierPath bezierPath];
    [upperVein moveToPoint:NSMakePoint(5.3, 11.9)];
    [upperVein curveToPoint:NSMakePoint(8.2, 13.2)
              controlPoint1:NSMakePoint(6.0, 12.3)
              controlPoint2:NSMakePoint(7.1, 13.1)];
    upperVein.lineWidth = 1.05;
    [upperVein stroke];

    NSBezierPath *lowerVein = [NSBezierPath bezierPath];
    [lowerVein moveToPoint:NSMakePoint(10.2, 4.8)];
    [lowerVein curveToPoint:NSMakePoint(12.7, 6.1)
              controlPoint1:NSMakePoint(10.8, 5.2)
              controlPoint2:NSMakePoint(11.8, 6.1)];
    lowerVein.lineWidth = 1.05;
    [lowerVein stroke];

    [image unlockFocus];
    image.template = YES;
    return image;
}

@interface WallpaperWindow : NSWindow
@end

@implementation WallpaperWindow
- (BOOL)canBecomeKeyWindow { return YES; }
- (BOOL)canBecomeMainWindow { return YES; }
@end

@interface AppDelegate : NSObject <NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler>
@property(nonatomic, strong) WallpaperWindow *window;
@property(nonatomic, strong) WKWebView *webView;
@property(nonatomic, strong) NSPanel *launcherPanel;
@property(nonatomic, strong) NSButton *launcherButton;
@property(nonatomic, strong) NSStatusItem *statusItem;
@property(nonatomic, strong) NSMenuItem *returnToDesktopItem;
@property(nonatomic, assign) BOOL settingsMode;
@property(nonatomic, assign) BOOL wallpaperReady;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    [self createWindow];
    [self createLauncherPanel];
    [self createStatusItem];
    [self loadWallpaper];

    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(screenConfigurationChanged:)
               name:NSApplicationDidChangeScreenParametersNotification
             object:nil];
}

- (void)applicationWillTerminate:(NSNotification *)notification {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [self.webView.configuration.userContentController
        removeScriptMessageHandlerForName:@"wallpaperSettings"];
}

- (NSWindowLevel)desktopWallpaperLevel {
    NSWindowLevel iconLevel = (NSWindowLevel)CGWindowLevelForKey(kCGDesktopIconWindowLevelKey);
    return iconLevel - 1;
}

- (NSWindowLevel)desktopLauncherLevel {
    NSWindowLevel iconLevel = (NSWindowLevel)CGWindowLevelForKey(kCGDesktopIconWindowLevelKey);
    return iconLevel + 1;
}

- (void)createWindow {
    WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
    configuration.websiteDataStore = [WKWebsiteDataStore defaultDataStore];
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = NO;
    WKUserScript *hostConfigurationScript = [[WKUserScript alloc]
        initWithSource:@"window.WallpaperHostConfig = { platform: 'macos', layout: 'landscape' };"
        injectionTime:WKUserScriptInjectionTimeAtDocumentStart
        forMainFrameOnly:YES];
    [configuration.userContentController addUserScript:hostConfigurationScript];
    [configuration.userContentController addScriptMessageHandler:self name:@"wallpaperSettings"];

    NSRect contentRect = NSMakeRect(0.0, 0.0, WallpaperWidth, WallpaperHeight);
    self.webView = [[WKWebView alloc] initWithFrame:contentRect configuration:configuration];
    self.webView.navigationDelegate = self;
    self.webView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    self.webView.underPageBackgroundColor = [NSColor colorWithCalibratedWhite:0.03 alpha:1.0];

    self.window = [[WallpaperWindow alloc]
        initWithContentRect:contentRect
                  styleMask:NSWindowStyleMaskBorderless
                    backing:NSBackingStoreBuffered
                      defer:NO];
    self.window.contentView = self.webView;
    self.window.backgroundColor = [NSColor blackColor];
    self.window.opaque = YES;
    self.window.hasShadow = NO;
    self.window.releasedWhenClosed = NO;
    self.window.collectionBehavior = NSWindowCollectionBehaviorCanJoinAllSpaces |
                                     NSWindowCollectionBehaviorStationary |
                                     NSWindowCollectionBehaviorIgnoresCycle;
    [self placeWindowOnMainScreen];
    [self returnToDesktop];
}

- (void)createLauncherPanel {
    NSRect launcherRect = NSMakeRect(0.0, 0.0, LauncherSize, LauncherSize);
    self.launcherPanel = [[NSPanel alloc]
        initWithContentRect:launcherRect
                  styleMask:NSWindowStyleMaskBorderless | NSWindowStyleMaskNonactivatingPanel
                    backing:NSBackingStoreBuffered
                      defer:NO];
    self.launcherPanel.backgroundColor = [NSColor clearColor];
    self.launcherPanel.opaque = NO;
    self.launcherPanel.hasShadow = YES;
    self.launcherPanel.hidesOnDeactivate = NO;
    self.launcherPanel.releasedWhenClosed = NO;
    self.launcherPanel.becomesKeyOnlyIfNeeded = YES;
    self.launcherPanel.level = [self desktopLauncherLevel];
    self.launcherPanel.ignoresMouseEvents = NO;
    self.launcherPanel.collectionBehavior = NSWindowCollectionBehaviorCanJoinAllSpaces |
                                            NSWindowCollectionBehaviorStationary |
                                            NSWindowCollectionBehaviorIgnoresCycle;

    self.launcherButton = [[NSButton alloc] initWithFrame:launcherRect];
    self.launcherButton.title = @"";
    self.launcherButton.image = [NSImage
        imageWithSystemSymbolName:@"line.3.horizontal"
         accessibilityDescription:@"Ouvrir les réglages du marbre"];
    self.launcherButton.imagePosition = NSImageOnly;
    self.launcherButton.imageScaling = NSImageScaleProportionallyDown;
    self.launcherButton.bezelStyle = NSBezelStyleTexturedRounded;
    self.launcherButton.contentTintColor = [NSColor colorWithWhite:0.95 alpha:0.9];
    self.launcherButton.focusRingType = NSFocusRingTypeNone;
    self.launcherButton.toolTip = @"Ouvrir les réglages du marbre";
    self.launcherButton.target = self;
    self.launcherButton.action = @selector(openSettings:);
    self.launcherButton.enabled = NO;
    self.launcherButton.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    self.launcherPanel.contentView = self.launcherButton;

    [self placeLauncherPanel];
    [self.launcherPanel orderFrontRegardless];
}

- (void)createStatusItem {
    self.statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSSquareStatusItemLength];
    NSStatusBarButton *button = self.statusItem.button;
    button.image = LiquideStatusIcon();
    button.imagePosition = NSImageOnly;
    button.imageScaling = NSImageScaleProportionallyDown;
    button.accessibilityLabel = @"Liquide-Wallpaper";
    button.toolTip = @"Liquide-Wallpaper";

    NSMenu *menu = [[NSMenu alloc] init];
    NSMenuItem *settingsItem = [[NSMenuItem alloc]
        initWithTitle:@"Réglages du marbre…"
               action:@selector(openSettings:)
        keyEquivalent:@","];
    settingsItem.target = self;
    [menu addItem:settingsItem];

    self.returnToDesktopItem = [[NSMenuItem alloc]
        initWithTitle:@"Replacer en fond d’écran"
               action:@selector(returnToDesktopFromMenu:)
        keyEquivalent:@""];
    self.returnToDesktopItem.target = self;
    self.returnToDesktopItem.enabled = NO;
    [menu addItem:self.returnToDesktopItem];

    [menu addItem:[NSMenuItem separatorItem]];
    NSMenuItem *quitItem = [[NSMenuItem alloc]
        initWithTitle:@"Quitter Liquide-Wallpaper"
               action:@selector(quitApplication:)
        keyEquivalent:@"q"];
    quitItem.target = self;
    [menu addItem:quitItem];
    self.statusItem.menu = menu;
}

- (void)loadWallpaper {
    NSURL *resourcesURL = [[NSBundle mainBundle] resourceURL];
    if (resourcesURL == nil) {
        [self showLaunchError:@"Le dossier Resources du bundle est introuvable."];
        return;
    }

    NSURL *webRoot = [resourcesURL URLByAppendingPathComponent:@"web" isDirectory:YES];
    NSURL *indexURL = [webRoot URLByAppendingPathComponent:@"index.html"];
    if (![[NSFileManager defaultManager] fileExistsAtPath:indexURL.path]) {
        [self showLaunchError:@"Le moteur du fond d’écran est absent du bundle."];
        return;
    }

    @try {
        [self.webView loadFileURL:indexURL allowingReadAccessToURL:webRoot];
    }
    @catch (NSException *exception) {
        [self showLaunchError:exception.reason ?: @"WebKit n’a pas pu charger le fichier local."];
    }
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    self.wallpaperReady = YES;
    self.launcherButton.enabled = YES;
    if (!self.settingsMode) { [self.launcherPanel orderFrontRegardless]; }

    NSString *diagnosticScript =
        @"JSON.stringify({"
         "role: document.body.dataset.role || '',"
         "platform: document.documentElement.dataset.platform || '',"
         "canvas: [document.getElementById('wallpaper')?.width || 0, document.getElementById('wallpaper')?.height || 0],"
         "error: document.getElementById('render-error')?.hidden === false ? document.getElementById('render-error').textContent : ''"
         "})";
    [webView evaluateJavaScript:diagnosticScript completionHandler:^(id result, NSError *error) {
        if (error != nil) {
            os_log_error(OS_LOG_DEFAULT, "Diagnostic du fond d’écran impossible : %{public}@", error.localizedDescription);
            return;
        }
        os_log(OS_LOG_DEFAULT, "Liquide-Wallpaper prêt : %{public}@", result);
    }];
}

- (void)webView:(WKWebView *)webView
    didFailProvisionalNavigation:(WKNavigation *)navigation
                       withError:(NSError *)error {
    [self showLaunchError:error.localizedDescription];
}

- (void)webView:(WKWebView *)webView
    didFailNavigation:(WKNavigation *)navigation
             withError:(NSError *)error {
    [self showLaunchError:error.localizedDescription];
}

- (void)placeWindowOnMainScreen {
    NSScreen *screen = [NSScreen mainScreen] ?: [[NSScreen screens] firstObject];
    if (screen == nil) { return; }

    NSRect screenFrame = screen.frame;
    NSPoint origin = NSMakePoint(
        NSMidX(screenFrame) - WallpaperWidth / 2.0,
        NSMidY(screenFrame) - WallpaperHeight / 2.0
    );
    NSRect frame = NSMakeRect(origin.x, origin.y, WallpaperWidth, WallpaperHeight);
    [self.window setFrame:frame display:YES];
    [self placeLauncherPanel];
}

- (void)placeLauncherPanel {
    if (self.launcherPanel == nil || self.window == nil) { return; }

    NSRect wallpaperFrame = self.window.frame;
    NSRect launcherFrame = NSMakeRect(
        NSMinX(wallpaperFrame) + LauncherLeftInset,
        NSMaxY(wallpaperFrame) - LauncherTopInset - LauncherSize,
        LauncherSize,
        LauncherSize
    );
    [self.launcherPanel setFrame:launcherFrame display:YES];
}

- (void)screenConfigurationChanged:(NSNotification *)notification {
    [self placeWindowOnMainScreen];
    if (!self.settingsMode) { [self returnToDesktop]; }
}

- (void)openSettings:(id)sender {
    if (!self.wallpaperReady) { return; }

    self.settingsMode = YES;
    self.returnToDesktopItem.enabled = YES;
    [self.launcherPanel orderOut:nil];
    self.window.level = NSFloatingWindowLevel;
    self.window.ignoresMouseEvents = NO;
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
    [self.webView evaluateJavaScript:@"window.WallpaperController?.openSettings()"
                   completionHandler:nil];
}

- (void)returnToDesktopFromMenu:(id)sender {
    [self.webView evaluateJavaScript:@"window.WallpaperController?.closeSettings()"
                   completionHandler:nil];
    [self returnToDesktop];
}

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.name isEqualToString:@"wallpaperSettings"] &&
        [message.body isEqual:@"closed"] && self.settingsMode) {
        [self returnToDesktop];
    }
}

- (void)returnToDesktop {
    self.settingsMode = NO;
    self.returnToDesktopItem.enabled = NO;
    self.window.level = [self desktopWallpaperLevel];
    self.window.ignoresMouseEvents = YES;
    [self.window orderFrontRegardless];
    self.launcherPanel.level = [self desktopLauncherLevel];
    self.launcherPanel.ignoresMouseEvents = NO;
    [self placeLauncherPanel];
    [self.launcherPanel orderFrontRegardless];
}

- (void)quitApplication:(id)sender {
    [NSApp terminate:nil];
}

- (void)showLaunchError:(NSString *)message {
    NSAlert *alert = [[NSAlert alloc] init];
    alert.alertStyle = NSAlertStyleCritical;
    alert.messageText = @"Liquide-Wallpaper ne peut pas démarrer";
    alert.informativeText = message;
    [alert runModal];
    [NSApp terminate:nil];
}

@end

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        NSApplication *application = [NSApplication sharedApplication];
        AppDelegate *delegate = [[AppDelegate alloc] init];
        application.delegate = delegate;
        [application run];
    }
    return 0;
}
