import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, AppState } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';

export default function WebViewCall() {
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();

  // Background functionality
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'background') {
        // App đang chuyển vào background
        console.log('App moving to background - maintaining call');
        
        // Inject JavaScript để duy trì cuộc gọi
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'app_background',
          action: 'maintain_call'
        }));
      } else if (nextAppState === 'active') {
        // App đang active trở lại
        console.log('App returning to foreground');
        
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'app_foreground',
          action: 'restore_ui'
        }));
      }
    };

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  // JavaScript để tự động cấp phép camera và microphone + background support
  const injectedJS = `
    (function() {
      console.log('Setting up auto permissions and background support...');
      
      // Background call maintenance
      let wakeLock = null;
      let audioContext = null;
      let isCallActive = false;
      
      // Wake Lock API để giữ màn hình không tắt
      const requestWakeLock = async () => {
        try {
          if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Screen wake lock acquired');
            
            wakeLock.addEventListener('release', () => {
              console.log('Screen wake lock was released');
            });
          }
        } catch (err) {
          console.log('Wake lock request failed:', err);
        }
      };
      
      // Duy trì audio context để tránh bị pause
      const maintainAudioContext = () => {
        try {
          if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
              console.log('Audio context resumed');
            });
          }
        } catch (err) {
          console.log('Audio context maintenance failed:', err);
        }
      };
      
      // Listen for messages from React Native
      window.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message from RN:', data);
          
          if (data.type === 'app_background') {
            console.log('App moved to background - maintaining call');
            isCallActive = true;
            maintainAudioContext();
            requestWakeLock();
            
            // Prevent any UI sleep/pause
            setInterval(() => {
              if (isCallActive) {
                maintainAudioContext();
                console.log('Background maintenance tick');
              }
            }, 5000);
            
          } else if (data.type === 'app_foreground') {
            console.log('App returned to foreground');
            // Restore normal operations
          }
        } catch (err) {
          console.log('Message handling error:', err);
        }
      });
      
      // Override getUserMedia để tự động resolve
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        
        navigator.mediaDevices.getUserMedia = function(constraints) {
          console.log('getUserMedia requested with constraints:', constraints);
          isCallActive = true; // Mark call as active when media is requested
          
          // Tạo mock stream thành công
          return new Promise((resolve, reject) => {
            // Thử get media thật trước
            originalGetUserMedia(constraints)
              .then(stream => {
                console.log('Real media stream obtained');
                
                // Setup background maintenance for real stream
                stream.getTracks().forEach(track => {
                  track.addEventListener('ended', () => {
                    console.log('Track ended - attempting to restart');
                    // Có thể thêm logic restart track ở đây
                  });
                });
                
                requestWakeLock(); // Request wake lock when call starts
                maintainAudioContext();
                resolve(stream);
              })
              .catch(err => {
                console.log('Real media failed, creating mock stream:', err);
                
                // Tạo mock stream
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 640, 480);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '20px Arial';
                ctx.fillText('Mock Video Stream', 250, 240);
                
                const mockStream = canvas.captureStream(30);
                
                // Thêm mock audio track nếu cần
                if (constraints.audio) {
                  maintainAudioContext();
                  const oscillator = audioContext.createOscillator();
                  const dest = audioContext.createMediaStreamDestination();
                  oscillator.connect(dest);
                  oscillator.frequency.value = 0; // Silent
                  oscillator.start();
                  
                  dest.stream.getAudioTracks().forEach(track => {
                    mockStream.addTrack(track);
                  });
                }
                
                requestWakeLock();
                console.log('Mock stream created successfully');
                resolve(mockStream);
              });
          });
        };
      }
      
      // Override deprecated getUserMedia
      if (navigator.getUserMedia) {
        navigator.getUserMedia = function(constraints, success, error) {
          console.log('Legacy getUserMedia called');
          navigator.mediaDevices.getUserMedia(constraints)
            .then(success)
            .catch(error);
        };
      }
      
      // Auto-click permission buttons
      const autoClickAllow = () => {
        const selectors = [
          'button[data-testid="allow-button"]',
          'button[data-testid="allow"]', 
          'button:contains("Allow")',
          'button:contains("Cho phép")',
          'button:contains("Разрешить")',
          'button:contains("Permitir")',
          'button[aria-label*="Allow"]',
          '.allow-button',
          '[role="button"]:contains("Allow")'
        ];
        
        selectors.forEach(selector => {
          try {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
              if (button && typeof button.click === 'function') {
                console.log('Auto-clicking allow button:', button);
                button.click();
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });
      };
      
      // Run auto-click periodically
      const interval = setInterval(autoClickAllow, 500);
      setTimeout(() => clearInterval(interval), 10000); // Stop after 10 seconds
      
      // Immediate click
      setTimeout(autoClickAllow, 100);
      setTimeout(autoClickAllow, 1000);
      
      // Page visibility API để handle background/foreground
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('Page hidden - maintaining call');
          maintainAudioContext();
        } else {
          console.log('Page visible - restoring normal operation');
        }
      });
      
      console.log('Auto permissions and background support setup complete');
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      <WebView
        ref={webViewRef}
        source={{ 
          uri: 'https://demo.realtime.cloudflare.com/meeting?id=bbb58a10-701b-4694-9f61-21960b00ae32'
        }}
        userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        injectedJavaScript={injectedJS}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        style={styles.webview}
        startInLoadingState={true}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsProtectedMedia={true}
        allowsFullscreenVideo={true}
        allowsAirPlayForMediaPlayback={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        originWhitelist={['*']}
        onLoadStart={() => console.log('Loading started')}
        onLoadEnd={() => console.log('Loading finished')}
        onError={(error) => console.log('WebView error: ', error)}
        onMessage={(event) => {
          // Handle messages from WebView
          console.log('Message from WebView:', event.nativeEvent.data);
        }}
        // Background support props
        allowFileAccess={true}
        allowsLinkPreview={false}
        hideKeyboardAccessoryView={true}
        keyboardDisplayRequiresUserAction={false}
        suppressMenuItems={['copy', 'cut', 'paste', 'share']}
      />
      
      {/* Floating Control Buttons */}
      <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
        <Text style={styles.buttonText}>🔄</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  reloadButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
