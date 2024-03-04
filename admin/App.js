import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Image, Dimensions, Pressable, Alert, Modal } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import { TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { database, storage } from './firebaseConfig';
import {ref as databaseRef, push, remove, set} from 'firebase/database';
import {getDownloadURL, ref as storageRef, uploadBytes} from 'firebase/storage'
//check
console.log(storage);

//buttons styling
function Button({label, theme, onPress}) {
  if (theme === "primary") {
    return (
      <View
      style={[styles.buttonContainer, { borderWidth: 2, borderColor: "#282929", borderRadius: 15, marginTop: 20, marginBottom:20 }]}
      >
        <Pressable
          style={[styles.button, { backgroundColor: "#282929" }]}
          onPress={onPress}
        >
          <Feather name="plus" 
          size={24} 
          color="#ebebeb"
          style={styles.buttonIcon}
          />
          <Text style={[styles.buttonLabel, { color: "#ebebeb" }]}>{label}</Text>
        </Pressable>
    </View>
    );
  }

  return(
    <View style={[styles.buttonContainer, {borderWidth:2, borderColor: "#282929", borderRadius: 15}]}>
      <Pressable style={[styles.button, {backgroundColor:"#282929"}]} onPress={onPress}>
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}


//flashlist func
function Mylist({navigation, searchText, filteredData, setFilteredData, onDelete}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pickedImage, setPickedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [imageData, setImageData] = useState([]);

//searching
  useEffect(() => {
    if (searchText === '') {
      // searchtext empty, show all data
      setFilteredData(imageData);
    } else {
      const newData = imageData.filter((item) => {
        const itemData = item.caption ? item.caption.toUpperCase() : '';
        const searchTextUpper = searchText.toUpperCase();
        return itemData.includes(searchTextUpper);
      });  
      console.log('Filtered data:', newData);
      setFilteredData(newData);
    }
  }, [imageData, searchText]);
  
  //picking images(posters) from your gallery
  const pickImageAsync = async () => {
    
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {

      setModalVisible(true);
      setPickedImage(result.assets && result.assets.length > 0 ? result.assets[0] : null);
    } else {
      alert('You did not select any image.');
    }
  };
  
  //after picking image and adding caption, it uploads the data to firebase:)
  const handlePromptOK = async () => {
    if (pickedImage) {
      const uniqueIdentifier = Date.now().toString();
          try {
            //every console.log is for checking (there used to be tons of error)
            //this uploads data to firebase storage
            const storageReference = storageRef(storage, `images/${uniqueIdentifier}.jpg`);
            console.log('Uploading image to storage...');
            const imageBlob = await fetch(pickedImage.uri).then((res) => res.blob());
            await uploadBytes(storageReference, imageBlob, { contentType: 'image/jpeg' });
            console.log('Getting download URL...');
            const downloadURL = await getDownloadURL(storageReference);
            console.log('Download URL:', downloadURL);

            //the properties for the picked image to be stored and used later on
            const newImage = {
              id: filteredData.length + 1,
              image: {uri: downloadURL },
              caption: caption,
              storagePath: `images/${uniqueIdentifier}.jpg`,
            };
          
            console.log('New Image:', newImage);
            //imagedata is for original data
            setFilteredData([...filteredData, newImage]);
            setImageData([...filteredData, newImage]);
            
            setModalVisible(false);
            setPickedImage(null);
            //uploads to firebase database (storage can only store images:))
            const imageKey = `image${newImage.id}`;
            const imagesRef = push(databaseRef(database, `post/${imageKey}`));
            await set(imagesRef, newImage);

          } catch (error) {
            console.error('Error uploading image:', error);
          }
  } else {
    Alert.alert('Error', 'You must select an image.');
  }
};
   
  //flashlist time!
  return (
    <View style={{minHeight: 800, backgroundColor:'#151617'}}>
    <Button theme={"primary"} label="New" onPress={pickImageAsync}/>
    <FlashList
      data={filteredData}
      contentContainerStyle={[styles.container,{flex:1}]}
      renderItem={({ item }) => (
        <View>    
        <View style={styles.imageContainer}>
            <Pressable onPress={() => {
              const onSelect = () => {
              onSelect(item);}
              navigation.navigate('fullnews', {selectedImage: item.image})
              
            }}>
            <Image
              source={item.image}
              style={{
                width: 320*scale,
                height: 440*scale,
                alignItems: 'center',
                justifyContent: 'center',
                margin:30,
                borderRadius: 5,
              }}
            />
            </Pressable>
            <Text style={[{color: '#fff'}, {fontSize: 20*scale}, {flex: 1}]}>{item.caption}</Text>
              <View style={styles.footerContainer}>
                 <Button label="Delete" onPress={() => onDelete(item.id, item.caption)} />
              </View>
            </View>
      </View>
      )}
      estimatedItemSize={200}
      contentInsetAdjustmentBehavior="automatic"
    />    
    <Modal
    //this is used for adding caption:)
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
      style={{width:'60%', height: '40%'}}
    >
      <View style={styles.modalContainer}>
        <TextInput
          placeholder="Enter Caption"
          style={styles.modalInput}
          onChangeText={(text) => setCaption(text)}
        />
        <Pressable style={styles.modalButton} onPress={handlePromptOK}>
          <Text style={styles.modalButtonText}>OK</Text>
        </Pressable>
        <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
    <StatusBar style='light' />
  </View>
);
}

// for full screen view
function FullImageScreen({ route, navigation }) {
  const { selectedImage } = route.params;
  return (
    <View style={styles.container}>
      <Image style={{width, height}} source={selectedImage}/>
    </View>
  )
}


// for screeeeens and functions
const Stack = createNativeStackNavigator();

function App() {

  const [searchText, setSearchText] = useState('');
  const [imageData, setImageData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

//checking
  const handleSearch = () => {  
    console.log('Search button pressed');
    console.log('Search text:', searchText);

  };
  //deleting data (remove id from database)
  const handleDelete = (id, caption) => {
    Alert.alert(
      'Delete Confirmation',
      `Are you sure you want to delete "${caption}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            const newData = filteredData.filter((item) => item.id !== id);
            setFilteredData(newData);
            const imageKey = `image${id}`;
          const imageRef = databaseRef(database, `post/${imageKey}`);
          remove(imageRef).then(() => {
            console.log(`Image with id ${id} removed successfully.`);
          }).catch((error) => {
            console.error(`Error removing image with id ${id}:`, error);
          });
          },
        },
      ],
      {cancelable: false}
    );
  };
  //screeeens
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='News'>
        <Stack.Screen 

        name="News"         
        options={{
          headerStyle: {backgroundColor: '#080808'},
          headerTintColor: '#d7d8d9',
          headerTitle: () => (
            <View style={styles.searchbarContainer}>
            <Text style={{
              color: '#fff', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: 5, width: '12%', 
              fontSize: 18*scale, 
              padding: 0.001*scale, 
              fontWeight: 'bold', 
              fontStyle: 'normal'}}>
              NEWS
              </Text>
            <TextInput placeholder='Search'
            onChangeText={(text) => 
              setSearchText(text)
            }
            style={styles.textInput}/> 
             <Feather name="search" style={styles.searchButton} size={24} color="#fff" />
            </View>
          ),
          }}
          >
            {({navigation}) => (
              <Mylist
              filteredData={filteredData}
              navigation={navigation}
              searchText={searchText}
              setFilteredData={setFilteredData}
              onDelete={handleDelete}
              />
            )}
          </Stack.Screen>
        <Stack.Screen name="fullnews" component={FullImageScreen} options={{title: '', headerStyle:{backgroundColor:'#080808'}, headerTintColor: '#d7d8d9'}}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
export default App;

//STYLES
//for diff devices
const { width, height } = Dimensions.get('window');
const scale = width / 500;
//styles
const styles = StyleSheet.create({
  screeen: {
    flex:1,
    backgroundColor: '#151617',
    alignItems:'center',
    height: 200*scale, 
    width: Dimensions.get("screen").width
  },
  container: {
    flex: 1,
    backgroundColor: '#151617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    paddingTop: 58*scale,
    alignItems: 'center',
    justifyContent: 'center',    
    marginBottom: 110,
    marginTop:-68,
  },
  image: {
    width: 320*scale,
    height: 440*scale,
    borderRadius: 5,
    margin:8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    padding: 5*scale,
    paddingHorizontal:16*scale,
    backgroundColor: '#fff',
    borderRadius: 8,
    width:'72%',
    fontSize: 18*scale
  },
  searchButton: {
    padding: 7*scale,
    borderRadius:8
  },
  searchbarContainer:{
    marginTop:15,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8*scale,
    marginBottom: 30
  },
  buttonContainer: {
    width: 100*scale,
    height: 60*scale,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3*scale,
    marginTop:15
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    paddingRight: 8*scale,
  },
  buttonLabel: {
    color: '#ebebeb',
    fontSize: 16*scale,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
  plus: {
    flex: 1, 
    justifyContent: 'flex-end', 
    alignItems: 'flex-end', 
    position: 'absolute', 
    right: 0, 
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius:8,
  },
  modalContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20*scale,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    height: 480*scale, 
    width: 360*scale, 
    position:'absolute',
    top: '20%',
    left:'10%',
    elevation: 5,
  },
  modalInput: {
    height: 60*scale,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    width: '80%',
    paddingHorizontal: 10*scale,
    borderRadius: 8,
    fontSize:20*scale
  },
  modalButton: {
    backgroundColor: '#282929',
    padding: 10*scale,
    borderRadius: 8,
    marginTop: 10,
    width:100*scale,
    height:60*scale,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20*scale
  },
});