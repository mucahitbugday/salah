declare module '@react-native-community/netinfo' {
  interface NetInfoState {
    isConnected: boolean | null;
    type: string;
    isInternetReachable: boolean | null;
  }

  interface NetInfo {
    fetch(): Promise<NetInfoState>;
    addEventListener(
      listener: (state: NetInfoState) => void
    ): () => void;
  }

  const NetInfo: NetInfo;
  export default NetInfo;
}

