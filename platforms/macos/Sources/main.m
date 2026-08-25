#import <Cocoa/Cocoa.h>
#import <CoreGraphics/CoreGraphics.h>
#import <WebKit/WebKit.h>
#import <os/log.h>

static const CGFloat WallpaperWidth = 1470.0;
static const CGFloat WallpaperHeight = 956.0;

@interface WallpaperWindow : NSWindow
@end

@implementation WallpaperWindow
- (BOOL)canBecomeKeyWindow { return YES; }
- (BOOL)canBecomeMainWindow { return YES; }
@end

@interface AppDelegate : NSObject <NSApplicationDelegate, WKNavigationDelegate>
@property(nonatomic, strong) WallpaperWindow *window;
@property(nonatomic, strong) WKWebView *webView;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    [self createWindow];
    [self loadWallpaper];

    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(screenConfigurationChanged:)
               name:NSApplicationDidChangeScreenParametersNotification
             object:nil];
}

- (void)applicationWillTerminate:(NSNotification *)notification {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSWindowLevel)desktopWallpaperLevel {
    NSWindowLevel iconLevel = (NSWindowLevel)CGWindowLevelForKey(kCGDesktopIconWindowLevelKey);
    return iconLevel - 1;
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
}

- (void)screenConfigurationChanged:(NSNotification *)notification {
    [self placeWindowOnMainScreen];
    [self returnToDesktop];
}

- (void)returnToDesktop {
    self.window.level = [self desktopWallpaperLevel];
    self.window.ignoresMouseEvents = YES;
    [self.window orderFrontRegardless];
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
