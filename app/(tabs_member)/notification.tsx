import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Notification() {
  const webViewRef = useRef<WebView>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleStartCall = () => {
    setShowWebView(true);
  };

  const handleEndCall = () => {
    setShowWebView(false);
    setIsFullscreen(false);
  };

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // JavaScript để tự động cấp phép camera và microphone
  const injectedJS = `
    (function() {
      console.log('Setting up auto permissions...');
      
      // Override getUserMedia để tự động resolve
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        
        navigator.mediaDevices.getUserMedia = function(constraints) {
          console.log('getUserMedia requested with constraints:', constraints);
          
          // Tạo mock stream thành công
          return new Promise((resolve, reject) => {
            // Thử get media thật trước
            originalGetUserMedia(constraints)
              .then(stream => {
                console.log('Real media stream obtained');
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
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  const oscillator = audioContext.createOscillator();
                  const dest = audioContext.createMediaStreamDestination();
                  oscillator.connect(dest);
                  oscillator.frequency.value = 0; // Silent
                  oscillator.start();
                  
                  dest.stream.getAudioTracks().forEach(track => {
                    mockStream.addTrack(track);
                  });
                }
                
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
      
      console.log('Auto permissions setup complete');
    })();
    true;
  `;

  return (
    <View style={isFullscreen ? styles.fullscreenContainer : styles.container}>
      {isFullscreen && <StatusBar hidden={true} />}
      
      {!showWebView ? (
        // Màn hình chính với nút Call
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Video Call</Text>
          <Text style={styles.welcomeSubtitle}>Tap the button below to start your call</Text>
          <TouchableOpacity style={styles.callButton} onPress={handleStartCall}>
            <Text style={styles.callButtonText}>📞 Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Màn hình WebView
        <>
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
          />
          {!isFullscreen && (
            <>
              <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
                <Text style={styles.reloadText}>🔄</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
                <Text style={styles.endCallText}>📵</Text>
              </TouchableOpacity>
            </>
          )}
          {isFullscreen && (
            <TouchableOpacity style={styles.exitFullscreenButton} onPress={toggleFullscreen}>
              <Text style={styles.exitFullscreenText}>✕</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 50, // Giảm padding
    // maxHeight: '100vh' // Removed invalid value for React Native
    // If you want to limit height, use:
    // maxHeight: Dimensions.get('window').height
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reloadButton: {
    position: 'absolute',
    top: 35, // Đưa lên cao hơn÷∂
    left: 15, // Chuyển sang trái
    backgroundColor: '#007AFF',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  endCallButton: {
    position: 'absolute',
    top: 35,
    right: 60,
    backgroundColor: '#FF3B30',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exitFullscreenButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  reloadText: {
    color: 'white',
    fontSize: 16,
  },
  endCallText: {
    color: 'white',
    fontSize: 16,
  },
  exitFullscreenText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
});