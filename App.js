import React, {Component} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  BackHandler,
  Alert,
} from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';

import {DocumentView, RNPdftron} from 'react-native-pdftron';

const SERVER_URL = '192.168.88.31';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      permissionGranted: Platform.OS === 'ios' ? true : false,
      documentId: 'abc123',
      currentUser: 'sonlt@dgroup.co',
    };
    this._viewer = React.createRef();
    this.socket = null;
    RNPdftron.initialize('Insert commercial license key here after purchase');
    RNPdftron.enableJavaScript(true);
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      this.requestStoragePermission();
    }
  }

  async requestStoragePermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.setState({
          permissionGranted: true,
        });
        console.log('Storage permission granted');
      } else {
        this.setState({
          permissionGranted: false,
        });
        console.log('Storage permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  onLeadingNavButtonPressed = () => {
    console.log('leading nav button pressed');
    if (Platform.OS === 'ios') {
      Alert.alert(
        'App',
        'onLeadingNavButtonPressed',
        [{text: 'OK', onPress: () => console.log('OK Pressed')}],
        {cancelable: true},
      );
    } else {
      BackHandler.exitApp();
    }
  };

  onDocumentLoaded = () => {
    axios.get(`http://${SERVER_URL}:3000/api/annotations`).then(res => {
      const annotations = res.data;
      annotations.map(a =>
        this._viewer.importAnnotations(a.xfdf).catch(err => {
          console.log('err');
          console.log(err);
        }),
      );
    });
    this.socket = io(`http://${SERVER_URL}:4000`);
    this.socket.on('annotationUpdated', this.onAnnotationUpdated);
  };

  onAnnotationChanged = (action, annotations) => {};

  onAnnotationUpdated = data => {
    this._viewer.importAnnotationCommand(data.xfdf, false);
  };

  onExportAnnotationCommand = ({action, xfdfCommand}) => {
    // action = add / modify / delete
    console.log('xfdf');
    console.log(xfdfCommand);
    this.socket.emit('annotationChanged', {
      userId: this.state.currentUser,
      documentId: this.state.documentId,
      xfdf: xfdfCommand,
      action,
    });
  };

  render() {
    if (!this.state.permissionGranted) {
      return (
        <View style={styles.container}>
          <Text>Storage permission required.</Text>
        </View>
      );
    }

    const path =
      'https://pdftron.s3.amazonaws.com/downloads/pl/PDFTRON_mobile_about.pdf';
    // const wvsPath = `http://192.168.1.54:8090/blackbox/GetPDF?uri=${encodeURIComponent(path)}&fmt=data`;

    return (
      <DocumentView
        ref={c => (this._viewer = c)}
        document={path}
        showLeadingNavButton={true}
        leadingNavButtonIcon={
          Platform.OS === 'ios'
            ? 'ic_close_black_24px.png'
            : 'ic_arrow_back_white_24dp'
        }
        onLeadingNavButtonPressed={this.onLeadingNavButtonPressed}
        onDocumentLoaded={this.onDocumentLoaded}
        onAnnotationChanged={this.onAnnotationChanged}
        onExportAnnotationCommand={this.onExportAnnotationCommand}
        collabEnabled={true}
        currentUser={this.state.currentUser}
        annotationAuthor={this.state.currentUser}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
