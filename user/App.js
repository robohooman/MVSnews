import React, { useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Image, Dimensions, Pressable } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import { TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { database } from './firebaseConfig';
import {ref, onValue} from 'firebase/database';
import { useEffect } from 'react';


//flashlist function (scrolling)
function Mylist({navigation, filteredData}) {
  
  return (
    <View style={{minHeight: 800, backgroundColor:'#151617'}}>

       <FlashList
         data={filteredData}
         contentContainerStyle={[styles.container, {flex: 1}]}
         renderItem={({ item }) => {
           console.log('Image URL:', item.storagePath);
           return (
           <View>
           <View style={styles.imageContainer}>
               <Pressable onPress={() => {
                 console.log(item);
                 const onSelect = () => {
                 onSelect(item);}
                 navigation.navigate('fullnews', {selectedImage: item.storagePath})
                 
               }}>
               <Image
                   source={{ uri: item.storagePath }}
                 style={styles.image}
               />
               
               </Pressable>
                 <View
                     style={{   
                      width: 380 * scale,
                      maxWidth: '90%',
                      height: 100*scale,
                      maxHeight: '90%',
                      marginHorizontal: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 3*scale,
                      marginTop:15,
                      borderWidth: 2, 
                      borderColor: '#151617',
                      borderRadius: 5, 
                      marginTop: 30, 
                      marginBottom:0
                      }}>
                             <View style={{
                               borderRadius: 10,
                               width: '100%',
                               height: '100%',
                               alignItems: 'center',
                               justifyContent: 'center',
                               flexDirection: 'row',
                               flexWrap: 'wrap',
                               paddingHorizontal:0,
                               paddingVertical: 4
                             }}>
                                   <Text style={{
                                     color: '#fff', 
                                     fontSize: 20*scale, 
                                     textAlign: 'center',
                                     textAlignVertical: 'center', 
                                     flex:1}}>
                                     {item.caption}
                                     </Text>
                           </View>
                 </View>
         </View>              
         </View>
           )
         }}
         estimatedItemSize={200}
         contentInsetAdjustmentBehavior="automatic"
       />
       <StatusBar style='light' />
    </View>
   );
}

//for viewing in full screeeeeeeen
function FullImageScreen({ route }) {
  const { selectedImage } = route.params;
  return (
    <View style={styles.container}>
      <Image style={{width, height}} source={{uri: selectedImage}}/>
    </View>
  )
}




//for putting together functionss and screeens
const Stack = createNativeStackNavigator();

function App() {
  const [searchText, setSearchText] = useState('');
  const [imageData, setImageData] = useState([]);
  const [filteredData, setFilteredData] = useState([imageData]);
  //searching
  useEffect(() => {
    if (searchText === '') {
      // searchtext empty? show all data:)
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

  //fetching data from firebase db and firebase storage
  useEffect(() => {
    const imagesRef = ref(database, 'post/');
    onValue(imagesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Raw Data from Firebase:', data);
  
      if (data) {
        const dataArray = [];
  
        Object.entries(data).forEach(([outerKey, outerValue]) => {
          Object.entries(outerValue).forEach(([innerKey, innerValue]) => {
            const imageMetadata = {
              id: innerKey,
              ...innerValue,
            };
  
            if (imageMetadata.caption && imageMetadata.storagePath) {
              dataArray.push({
                id: imageMetadata.id,
                caption: imageMetadata.caption,
                storagePath: imageMetadata.image.uri,
              });
            } else {
              console.error('Invalid caption or image metadata:', imageMetadata.caption, imageMetadata.storagePath);
            }
          });
        });
  
        console.log('Fetched data:', dataArray);
        setImageData(dataArray);
        setFilteredData(dataArray);
      } else {
        console.error('Invalid data:', data);
      }
    });
  }, []);
  
  //for checking;) in case of an error:(
  const handleSearch = () => {  
    console.log('Search button pressed');
  console.log('Search text:', searchText);
  }

//screeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeens
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
              margin: 5, width: '12%', fontSize: 14*scale, padding: 0.001*scale, fontWeight: 'bold', fontStyle: 'normal'}}>NEWS</Text>
            <TextInput placeholder='Search'
            onChangeText={(text) => 
              setSearchText(text)
            }
            style={styles.textInput}/> 
             <Feather name="search" style={styles.searchButton} size={24} color="#fff"  />
            </View>
          ),
          }}
          >
            {({navigation}) => (
              <Mylist
              filteredData={filteredData}
              navigation={navigation}
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
    justifyContent: 'center',
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
    marginBottom: 50,
    marginTop:150,
    top: '-20%',

  },
  image: {
    width: 365*scale,
    height: 525*scale,
    borderRadius: 5,
    margin:0,
    marginTop: -23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    padding: 5* scale,
    paddingHorizontal:16*scale,
    backgroundColor: '#fff',
    borderRadius: 8,
    width:'72%',
    fontSize: 16*scale
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
});