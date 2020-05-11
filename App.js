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

import {DocumentView, RNPdftron} from 'react-native-pdftron';

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
    // TODO load annotations from api-server
    const annotations = [
      {
        xfdf: `<?xml version="1.0" encoding="UTF-8"?>
<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">
\t<add>
\t\t<ink style="solid" width="5" color="#E44234" opacity="1" creationdate="D:20200511070432Z" flags="print" date="D:20200511070432Z" name="03530ac3-e283-4c16-970a-9464df6ec7d7" page="0" rect="149.921,276.845,400.278,684.065" title="sonlt@dgroup.co">
\t\t\t<inklist>
\t\t\t\t<gesture>190.951,568.239;190.951,569.965;190.951,572.786;190.951,577.301;192.651,584.67;194.35,594.861;200.009,608.471;204.548,622.081;209.086,635.657;210.786,643.026;215.324,653.217;216.445,664.005;216.445,666.827;218.145,673.068;219.284,677.582;219.284,680.404;219.284,681.565;219.284,680.404;219.284,678.711;219.284,675.889;219.284,673.068;219.284,671.342;219.284,668.52;219.284,666.827;219.284,665.134;219.284,661.151;219.284,659.458;219.284,656.636;219.284,652.089;220.983,647.574;222.683,640.205;222.683,632.271;223.822,623.773;225.522,614.711;227.221,605.649;228.342,594.861;231.741,586.363;232.88,577.301;232.88,568.239;234.58,559.177;235.719,550.114;237.419,541.052;240.258,532.554;241.957,521.799;243.657,511.608;246.477,499.127;249.316,490.629;252.715,478.746;253.854,467.991;255.554,458.928;256.675,448.704;261.213,430.58;262.913,423.211;265.752,405.087;267.451,397.717;269.151,385.834;270.29,373.95;271.99,363.162;271.99,358.647;273.11,351.278;273.11,345.602;274.81,341.087;274.81,337.668;274.81,334.846;274.81,333.154;271.99,334.846;270.29,334.846;270.29,336.539;269.151,336.539;267.451,336.539;265.752,336.539;261.213,336.539;258.374,336.539;253.854,336.539;248.177,334.846;241.957,332.025;230.042,325.784;219.284,318.415;209.086,312.772;202.848,309.353;194.35,303.677;183.593,299.162;180.754,295.776;176.215,292.921;169.977,290.1;165.457,287.278;162.619,285.552;159.78,283.859;158.08,282.731;155.26,281.038;152.421,279.345;153.56,279.345;155.26,279.345;156.959,279.345;159.78,281.038;162.619,282.731;165.457,283.859;174.516,290.1;181.893,295.776;186.413,300.291;194.35,308.224;202.848,313.901;211.925,322.963;222.683,330.332;232.88,337.668;241.957,345.602;252.715,351.278;261.213,355.826;269.151,360.34;277.649,364.888;283.887,367.709;290.106,370.531;295.784,372.224;302.022,373.95;307.681,376.771;315.04,378.464;322.977,381.319;328.655,383.012;334.874,385.834;342.252,386.962;346.771,388.655;352.449,391.51;356.988,393.203;363.207,394.896;367.745,396.024;373.404,399.443;377.943,400.572;381.342,400.572;385.32,402.265;388.719,403.958;391.54,403.958;393.239,405.087;394.378,405.087;396.078,405.087;397.778,405.087</gesture>
\t\t\t</inklist>
\t\t</ink>
\t</add>
\t<modify />
\t<delete />
\t<pdf-info import-version="3" version="2" xmlns="http://www.pdftron.com/pdfinfo" />
</xfdf>`,
      },
    ];
    annotations.map(a =>
      this._viewer.importAnnotations(a.xfdf).catch(err => {
        console.log('err');
        console.log(err);
      }),
    );
    this.socket = io('http://192.168.88.31:4000');
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
