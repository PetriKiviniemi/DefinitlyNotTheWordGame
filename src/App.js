import React from 'react'

import './App.css';
import { wordList } from './WordleWords.js'
import { GameState } from './constants/gamestate'

function resizeTimer(fn, ms) 
{
    let timer
    return _ => {
        clearTimeout(timer)
        timer = setTimeout(_ => {
            timer = null
            fn.apply(this, arguments)
        }, ms)
    };
}

function wordNumReducer(state, action)
{
    switch(action.type) {
        case "letter++":
            return {curLetterIdx: state.curLetterIdx + 1, curWordIdx: state.curWordIdx};
        case "letter--":
            return {curLetterIdx: state.curLetterIdx - 1, curWordIdx: state.curWordIdx};
        case "word++":
            return {curLetterIdx: state.curLetterIdx, curWordIdx: state.curWordIdx + 1};
        case "word--":
            return {curLetterIdx: state.curLetterIdx, curWordIdx: state.curWordIdx - 1};
        case "reset_letter":
            return {curLetterIdx: 0, curWordIdx: state.curWordIdx};
        case "reset":
            return {curLetterIdx: 0, curWordIdx: 0};
        default:
            throw new Error();
    }
}


function App() {
    const words = wordList[0]["words"] 
    const keyboardKeys = [
        "q","w","e","r","t","y","u","i","o","p",
        "a","s","d","f","g","h","j","k","l",
        "z","x","c","v","b","n","m", ",", ".", "-", "'"
    ] 

    const [dimensions, setDimensions] = React.useState({
        height: window.innerHeight,
        width: window.innerWidth
    });

    const initialLettersDict = {
        letters: {
            "word1": ["","","","",""],
            "word2": ["","","","",""],
            "word3": ["","","","",""], 
            "word4": ["","","","",""],
            "word5": ["","","","",""],
            "word6": ["","","","",""]
        }
    }

    //TODO:: Use reducer
    const [lettersDict, setLetters] = React.useState(initialLettersDict);

    const [gameState, setGameState] = React.useState(GameState.WRITING);
    const [wordState, setWordState] = React.useReducer(wordNumReducer, {curLetterIdx: 0, curWordIdx: 0});
    const [infoText, setInfoText] = React.useState("");
    const [correctWord, setCorrectWord] = React.useState(0);
    const [isGameInitialized, setGameInitialized] = React.useState(0);
    const domLetterGrid = React.useRef([]);
    const domKeyboardGrid = React.useRef([]);
    const domRestartBtn = React.useRef(null);

    const handleReset = (e) => 
    {
        init()
    }

    const init = () => 
    {
        const randomNumber = Math.floor(Math.random() * wordList[0]["words"].length)
        setCorrectWord(wordList[0]["words"][randomNumber])
        setWordState({type: "reset"})
        setLetters(initialLettersDict)
        setInfoText("")
        setGameState(GameState.WRITING)
        domRestartBtn.current.className = 'app-hidden'
        domLetterGrid.current.forEach((val, idx) => {
            val.className = 'app-input-field'
        })
        domKeyboardGrid.current.forEach((val, idx) => {
            val.className = 'app-keyboard-key'
        })
    }

    const loseGame = () => 
    {
        console.log("Game lost")
        setInfoText("You lost the game. Want to try again?")
        domRestartBtn.current.className = "app-restart-button"
    }

    //Decouple this functionality so that we can change keyPressedHandler without affecting handleKeyboardClick 
    const handleKeyPress = (key) => 
    {
        setInfoText("")
        if(gameState === GameState.WRITING)
        {
            if(keyboardKeys.includes(key))
            {
                if(wordState.curLetterIdx < 5)
                {
                    //Apply the letter to the current word
                    const wordKey = Object.keys(lettersDict.letters)[wordState.curWordIdx]
                    changeLettersArray(wordKey, wordState.curLetterIdx, key)
                    setWordState({type: "letter++"})
                }
            }
            if(key === "Backspace")
            {
                const wordKey = Object.keys(lettersDict.letters)[wordState.curWordIdx]
                changeLettersArray(wordKey, wordState.curLetterIdx-1, "")
                if(wordState.curLetterIdx > 0)
                   setWordState({type: "letter--"}) 
            }
            if(key === "Enter")
            {
                setGameState(GameState.APPLYING);
                applyCurWord();
            }
        }
    }

    const keyPressedHandler = ({key}) => 
    {
        handleKeyPress(key)
    }

    const handleKeyboardClick = (e) => 
    {
        var keyPressed = "";
        if(e.target.innerHTML.includes("<p>"))
            keyPressed = e.target.innerHTML.replace("<p>", "").replace("</p>", "")
        else
            keyPressed = e.target.innerHTML
        handleKeyPress(keyPressed)
    }

    const changeLettersArray = (wordKey, letterIdx, newLetter) => 
    {
        var temp = lettersDict
        temp.letters[wordKey][letterIdx] = newLetter
        setLetters({...lettersDict, temp})
    }

    const applyCurWord = () => 
    {
        //Apply the word and do a check
        const letters = lettersDict.letters[Object.keys(lettersDict.letters)[wordState.curWordIdx]]
        const word = letters.join(',').replaceAll(',', '')
        if(words.includes(word))
        {
            //Check if the word was correct, or if it was partly correct
            if(correctWord === word)
            {
                setGameState(GameState.VICTORY)
                for(let i = 0; i < correctWord.length; i++)
                {
                    domLetterGrid.current[wordState.curWordIdx * 5 + i].className = 'app-input-field-right'
                    domKeyboardGrid.current[keyboardKeys.indexOf(correctWord[i])].className = 'app-keyboard-key-right'
                }
                //Show victory screen and return
                setInfoText("You won the game!")
                domRestartBtn.current.className = 'app-restart-button'
                return
            }
            else if(correctWord.split("").some(r => word.split("").includes(r)))
            {
                //Part of the word was right
                //Check which letters were right, and their indices in both arrays
                //Play animation depending if the indices match or not

                const corWordList = correctWord.split("")
                const ourWordList = word.split("")

                corWordList.forEach(function (cletter, i) {
                    ourWordList.forEach(function (oletter, j){
                        if(cletter === oletter)
                        {
                            domLetterGrid.current[wordState.curWordIdx * 5 + i].className = 'app-input-field-right'
                            domKeyboardGrid.current[keyboardKeys.indexOf(oletter)].className = 'app-keyboard-key-right'
                        }
                        else if(corWordList.includes(oletter))
                        {
                            domLetterGrid.current[wordState.curWordIdx * 5 + j].className = 'app-input-field-partly-right'
                            domKeyboardGrid.current[keyboardKeys.indexOf(oletter)].className = 'app-keyboard-key-partly-right'
                        }
                        else
                        {
                            domLetterGrid.current[wordState.curWordIdx * 5 + j].className = 'app-input-field-wrong'
                            domKeyboardGrid.current[keyboardKeys.indexOf(oletter)].className = 'app-keyboard-key-wrong'
                        }
                    })
                })

                //NOTE:: To mimic the original, we could buffer these animations

            }
            else
            {
                for(let i = 0; i < word.length; i++)
                {
                    domLetterGrid.current[wordState.curWordIdx * 5 + i].className = 'app-input-field-wrong'
                }
            }
            
            //Victory!
            setWordState({type: "word++"}) 
            setWordState({type: "reset_letter"})
        }
        else
        {
            //Word was not in the dictionary!
            setInfoText("Word was not in the dictionary")
        }
        if(wordState.curWordIdx === 5)
        {
            //Game lost
            setGameState(GameState.DEFEAT)
            loseGame()
        }
        setGameState(GameState.WRITING);
    }


    React.useEffect(() => {
        //TODO:: USE useReducer OR useCallback instead of useEffect for this to reduce amount of subscriptions
        const timedHandleWinResize = resizeTimer(function handleWinResize() {
            setDimensions({
                height: window.innerHeight,
                width: window.innerWidth
            })
        }, 50)

        window.addEventListener('resize', timedHandleWinResize)
        window.addEventListener('keyup', keyPressedHandler)

        return _ => {
            window.removeEventListener('resize', timedHandleWinResize)
            window.removeEventListener('keyup', keyPressedHandler)
        }
    }, [wordState.curLetterIdx, wordState.curWordIdx, gameState]);

    React.useEffect(() => {
        init();

    },[isGameInitialized]);

    return (
        <div className="App">
           <div className="app-nav-bar-container">
               <div className="app-nav-bar-header">
                   <h1>
                       DefinitlyNotTheWordGame 
                   </h1>
               </div>
           </div>
           <div className="app-input-fields-container"
                style={{
                    width: (dimensions.width/4.6).toString() + "px",
                    height: (dimensions.height/2).toString() + "px"
                }}>
               <div className="app-input-fields-wrapper">
                   {
                       Object.keys(lettersDict.letters).map((key) => 
                           {
                               return(
                                   lettersDict.letters[key].map((values, index) => {
                                       return(
                                           <div 
                                               ref={el => domLetterGrid.current[(parseInt(key.slice(key.length-1, key.length))- 1) * 5 + index] = el}
                                               key={key + index}
                                               className="app-input-field"
                                           >
                                               <p>
                                                   {values}
                                               </p>
                                           </div>
                                       );
                                   })
                               );
                           })
                   }
               </div>
           </div>
           <div className="app-info-text-container">
              <p>{infoText}</p>
              <button ref={domRestartBtn} onClick={handleReset} className="app-restart-button">Play again!</button>
           </div>
           <div className="app-keyboard-container">
               <ul className="app-keyboard-wrapper">
                   {
                       keyboardKeys.map((key, idx) => 
                           {
                               return(
                                   <li ref={el => domKeyboardGrid.current[idx] = el}
                                   onClick={handleKeyboardClick}
                                   key={"keyboard:" + key}
                                   className="app-keyboard-key">
                                       <p>
                                           {key}
                                       </p>
                                   </li>
                               );
                           }
                       )
                   }
               </ul>
           </div>
            
        </div>
    );

}


export default App;
