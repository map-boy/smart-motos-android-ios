import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, CameraView,CameraType } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

interface CameraCaptureProps {
  onCapture: (imageUri: string) => void;
  onCancel: () => void;
}

const isImageBlurry = async (uri: string): Promise<boolean> => {
  // Placeholder for a real blur detection algorithm
  // For now, always return false (not blurry)
  // You can integrate a real blur detection library or API here
  return false;
};

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [checkingBlur, setCheckingBlur] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isBlurry, setIsBlurry] = useState(false);
  const [cameraType, setCameraType] = useState<"back" | "front">("back");

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setCapturedUri(photo.uri);
      setCheckingBlur(true);
      const blurry = await isImageBlurry(photo.uri);
      setIsBlurry(blurry);
      setCheckingBlur(false);
    }
  };

  if (hasPermission === null) {
    return <ActivityIndicator size="large" color="#000" />;
  }
  if (hasPermission === false) {
    return <Text style={{ color: 'red' }}>No access to camera</Text>;
  }

  if (capturedUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: capturedUri }} style={styles.previewImage} />
        {checkingBlur ? (
          <ActivityIndicator size="small" color="#000" />
        ) : isBlurry ? (
          <Text style={styles.warningText}>Image appears blurry. Please retake a clearer photo.</Text>
        ) : (
          <Text style={styles.successText}>Looks good! If readable, continue.</Text>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => setCapturedUri(null)}>
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isBlurry ? '#aaa' : '#28a745' }]}
            onPress={() => !isBlurry && onCapture(capturedUri)}
            disabled={isBlurry}
          >
            <MaterialIcons name="check" size={24} color="#fff" />
            <Text style={styles.buttonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.cancelLink}>
          <Text style={{ color: '#888', marginTop: 10 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      <View style={styles.captureButtonContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <MaterialIcons name="camera" size={32} color="#fff" />
        </TouchableOpacity>
        {/* Optional: Add a button to switch cameras */}
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() =>
            setCameraType(
              cameraType === "back"
                ? "front"
                : "back"
            )
          }
        >
          <MaterialIcons name="flip-camera-ios" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.cancelLink}>
        <Text style={{ color: '#888', marginTop: 10 }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    minHeight: 400,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    width: 320,
    height: 400,
    borderRadius: 12,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  captureButton: {
    backgroundColor: '#007bff',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    minHeight: 400,
  },
  previewImage: {
    width: 320,
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  warningText: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cancelLink: {
    alignSelf: 'center',
    marginTop: 10,
  },
});

export default CameraCapture;
