I generated the following inventory of games and scoring systems to help brainstorm on common patterns and variables.  Games without round progressions are super easy to model, and will mostly be the same and easy to adapt.  Games with round progression are a little more difficult to model consistently, and you will be expected to score the event for the user (add up).  You could potentially launch without round support - that is, the user only records the result of the match/event.  For games like pickleball/spikeball it probably won't be all that satisfying or compelling though.

I suspect if you just provide a robust set of games/eventTypes, you'll be able to avoid forcing the user down the path of eventType authoring.  If you did want to expose this function to the user, ou can probably provide templates for them to clone and adapt.

You will need to give some thought to a mobile web interface dedicated to the act of scoring a match.


| EventType                          | Min per Side | Max per Side | Round Progression | Score vernacular | Win Determination        |
|------------------------------------:|--------------|--------------|-------------------|------------------|--------------------------|
| Tennis                             | 1            | 2            | game-set-match    | points           | First to +2              |
| Tennis (Tiebreak)                  | 1            | 2            | tiebreak          | points           | First to 7 (+2)          |
| Tennis (No-Ad)                     | 1            | 2            | game-set-match    | points           | First to 4               |
| Badminton                          | 1            | 2            | game-match        | points           | First to +2              |
| Badminton (Rally Point)            | 1            | 2            | game-match        | points           | First to 21              |
| Ping Pong                          | 1            | 2            | game-match        | points           | First to +2              |
| Ping Pong (11-point)               | 1            | 2            | game-match        | points           | First to 11 (+2)         |
| Ping Pong (21-point)               | 1            | 2            | game-match        | points           | First to 21 (+2)         |
| Racquetball                        | 1            | 2            | game-match        | points           | First to +2              |
| Racquetball (Cutthroat)            | 3            | 3            | game              | points           | First to 11              |
| Handball                           | 1            | 2            | game-match        | points           | First to +2              |
| Handball (Four Wall)               | 1            | 4            | game-match        | points           | First to 21              |
| Volleyball                         | 6            | 6            | set-match         | points           | First to +2              |
| Volleyball (Beach)                 | 2            | 2            | set-match         | points           | First to +2              |
| Volleyball (Wallyball)             | 3            | 6            | game              | points           | First to 15              |
| Basketball                         | 5            | 5            | game              | points           | Most points              |
| Basketball (3v3)                   | 3            | 3            | game              | points           | First to 21              |
| Basketball (21)                    | 3            | 8            | game              | points           | Exactly 21               |
| Basketball (HORSE)                 | 2            | 8            | game              | letters          | Spell H-O-R-S-E          |
| Basketball (Lightning)             | 8            | 20           | elimination       | shots            | Last shooter standing    |
| Basketball (Around the World)      | 2            | 10           | game              | spots            | Complete circuit first   |
| Basketball (Knockout)              | 8            | 20           | elimination       | shots            | Last shooter standing    |
| Basketball (One-on-One)            | 1            | 1            | game              | points           | First to 11/15/21        |
| Baseball                           | 9            | 9            | inning-game       | runs             | Most runs                |
| Baseball (Softball)                | 9            | 9            | inning-game       | runs             | Most runs                |
| Baseball (T-Ball)                  | 9            | 9            | inning-game       | runs             | Most runs                |
| Baseball (Wiffle Ball)             | 1            | 9            | inning-game       | runs             | Most runs                |
| Baseball (Home Run Derby)          | 1            | 1            | round             | home runs        | Most home runs           |
| Spikeball                          | 2            | 2            | game-match        | points           | First to +2              |
| Spikeball (Rally Scoring)          | 2            | 2            | game              | points           | First to 15              |
| Foosball                           | 1            | 2            | game              | goals            | First to score limit     |
| Foosball (Doubles)                 | 2            | 2            | game              | goals            | First to 5/10            |
| Chess                              | 1            | 1            | game              | moves            | Checkmate/Resignation    |
| Chess (Speed/Blitz)                | 1            | 1            | game              | time/moves       | Checkmate/Time           |
| Chess (Bullet)                     | 1            | 1            | game              | time/moves       | Checkmate/Time           |
| Chess (King of the Hill)           | 1            | 1            | game              | moves            | King to center           |
| Chess (960/Fischer Random)         | 1            | 1            | game              | moves            | Checkmate/Resignation    |
| Chess (Bughouse)                   | 2            | 2            | game              | moves            | Checkmate either board   |
| Checkers                           | 1            | 1            | game              | moves            | Capture all/Block        |
| Checkers (International/10x10)     | 1            | 1            | game              | moves            | Capture all/Block        |
| Go                                 | 1            | 1            | game              | stones/territory | Most territory           |
| Go (Capture Go)                    | 1            | 1            | game              | captures         | First capture wins       |
| Pickleball                         | 1            | 2            | game-match        | points           | First to +2              |
| Pickleball (Rally Scoring)         | 1            | 2            | game-match        | points           | First to 15              |
| Squash                             | 1            | 2            | game-match        | points           | First to +2              |
| Squash (American Scoring)          | 1            | 2            | game-match        | points           | First to 15              |
| Soccer                             | 11           | 11           | game              | goals            | Most goals               |
| Soccer (Indoor/Futsal)             | 5            | 5            | game              | goals            | Most goals               |
| Soccer (7v7)                       | 7            | 7            | game              | goals            | Most goals               |
| Soccer (Penalty Shootout)          | 1            | 11           | shootout          | goals            | Most penalty goals       |
| American Football                  | 11           | 11           | quarter-game      | points           | Most points              |
| American Football (Flag)           | 5            | 9            | game              | points           | Most points              |
| American Football (Touch)          | 6            | 11           | game              | points           | Most points              |
| American Football (Two-Hand Touch) | 7            | 11           | game              | points           | Most points              |
| Rugby                              | 15           | 15           | half-game         | points           | Most points              |
| Rugby (Sevens)                     | 7            | 7            | half-game         | points           | Most points              |
| Rugby (League)                     | 13           | 13           | half-game         | points           | Most points              |
| Cricket                            | 11           | 11           | innings-match     | runs             | Most runs                |
| Cricket (T20)                      | 11           | 11           | innings-match     | runs             | Most runs                |
| Cricket (One Day)                  | 11           | 11           | innings-match     | runs             | Most runs                |
| Hockey                             | 6            | 6            | period-game       | goals            | Most goals               |
| Hockey (Street/Ball)               | 3            | 6            | game              | goals            | Most goals               |
| Hockey (Pond)                      | 3            | 10           | game              | goals            | Most goals               |
| Lacrosse                           | 10           | 10           | quarter-game      | goals            | Most goals               |
| Lacrosse (Box)                     | 6            | 6            | period-game       | goals            | Most goals               |
| Water Polo                         | 7            | 7            | quarter-game      | goals            | Most goals               |
| Field Hockey                       | 11           | 11           | quarter-game      | goals            | Most goals               |
| Softball                           | 9            | 9            | inning-game       | runs             | Most runs                |
| Softball (Slow Pitch)              | 9            | 9            | inning-game       | runs             | Most runs                |
| Softball (Fast Pitch)              | 9            | 9            | inning-game       | runs             | Most runs                |
| Beach Volleyball                   | 2            | 2            | set-match         | points           | First to +2              |
| Ultimate Frisbee                   | 7            | 7            | game              | points           | First to score limit     |
| Ultimate Frisbee (Beach)           | 5            | 5            | game              | points           | First to score limit     |
| Cornhole                           | 1            | 2            | game              | points           | First to 21              |
| Cornhole (Cancellation)            | 1            | 2            | game              | points           | First to 21              |
| Horseshoes                         | 1            | 2            | game              | points           | First to 21              |
| Horseshoes (Count All)             | 1            | 2            | game              | points           | First to 40              |
| Darts                              | 1            | 4            | leg-set-match     | points           | Reduce to zero           |
| Darts (Cricket)                    | 1            | 4            | game              | marks            | Close all numbers        |
| Darts (Around the Clock)           | 1            | 8            | game              | numbers          | Hit 1-20 in order        |
| Pool/Billiards (8-Ball)            | 1            | 2            | rack-set          | balls            | Sink 8-ball legally      |
| Pool/Billiards (9-Ball)            | 1            | 2            | rack-set          | balls            | Sink 9-ball              |
| Pool/Billiards (Straight)          | 1            | 2            | rack-set          | points           | First to point limit     |
| Pool/Billiards (Cutthroat)         | 3            | 3            | game              | balls            | Last with balls          |
| Air Hockey                         | 1            | 2            | game              | goals            | First to score limit     |
| Bowling                            | 1            | 8            | frame-game        | pins             | Most pins                |
| Bowling (Candlepin)                | 1            | 6            | frame-game        | pins             | Most pins                |
| Bowling (Duckpin)                  | 1            | 6            | frame-game        | pins             | Most pins                |
| Golf                               | 1            | 4            | hole-round        | strokes          | Fewest strokes           |
| Golf (Match Play)                  | 1            | 4            | hole-match        | holes won        | Most holes won           |
| Golf (Scramble)                    | 4            | 4            | hole-round        | strokes          | Fewest team strokes      |
| Golf (Best Ball)                   | 2            | 4            | hole-round        | strokes          | Best individual score    |
| Mini Golf                          | 1            | 6            | hole-round        | strokes          | Fewest strokes           |
| Disc Golf                          | 1            | 4            | hole-round        | throws           | Fewest throws            |
| Poker (Texas Hold'em)              | 2            | 10           | hand-tournament   | chips            | Most chips               |
| Poker (Omaha)                      | 2            | 10           | hand-tournament   | chips            | Most chips               |
| Poker (Seven Card Stud)            | 2            | 8            | hand-tournament   | chips            | Most chips               |
| Poker (Five Card Draw)             | 2            | 7            | hand-tournament   | chips            | Most chips               |
| Blackjack                          | 1            | 7            | hand              | points           | Closest to 21            |
| Blackjack (Spanish 21)             | 1            | 7            | hand              | points           | Closest to 21            |
| Backgammon                         | 1            | 1            | game-match        | pips             | Bear off all pieces      |
| Backgammon (Nackgammon)            | 1            | 1            | game-match        | pips             | Bear off all pieces      |
| Scrabble                           | 2            | 4            | game              | points           | Most points              |
| Scrabble (Speed)                   | 2            | 4            | game              | points           | Most points              |
| Monopoly                           | 2            | 8            | game              | money            | Last player standing     |
| Monopoly (Speed)                   | 2            | 6            | game              | money            | Most money at time limit |
| Risk                               | 2            | 6            | game              | territories      | World domination         |
| Risk (Speed)                       | 2            | 6            | game              | territories      | Most territories         |
| Settlers of Catan                  | 3            | 4            | game              | victory points   | First to 10 points       |
| Settlers (Cities & Knights)        | 3            | 4            | game              | victory points   | First to 13 points       |
| Uno                                | 2            | 10           | hand              | cards            | First to empty hand      |
| Uno (Wild)                         | 2            | 10           | hand              | cards            | First to empty hand      |
| Hearts                             | 4            | 4            | trick-game        | points           | Fewest penalty points    |
| Hearts (No Queen)                  | 4            | 4            | trick-game        | points           | Fewest penalty points    |
| Spades                             | 4            | 4            | trick-game        | points           | First to 500             |
| Spades (Cutthroat)                 | 3            | 3            | trick-game        | points           | First to 500             |
| Bridge                             | 4            | 4            | trick-game        | points           | Contract fulfillment     |
| Bridge (Duplicate)                 | 4            | 4            | board-session     | points           | Most match points        |
| Euchre                             | 4            | 4            | trick-game        | points           | First to 10              |
| Euchre (Three-Handed)              | 3            | 3            | trick-game        | points           | First to 10              |
| Cribbage                           | 2            | 4            | hand-game         | points           | First to 121             |
| Cribbage (Three-Handed)            | 3            | 3            | hand-game         | points           | First to 121             |
| Speed Cubing (3x3)                 | 1            | 1            | solve             | time             | Fastest time             |
| Speed Cubing (2x2)                 | 1            | 1            | solve             | time             | Fastest time             |
| Speed Cubing (4x4)                 | 1            | 1            | solve             | time             | Fastest time             |
| Speed Cubing (One-Handed)          | 1            | 1            | solve             | time             | Fastest time             |
| Speed Cubing (Blindfolded)         | 1            | 1            | solve             | time             | Fastest time             |
| Jenga                              | 2            | 8            | game              | blocks           | Last to not topple       |
| Jenga (Giant)                      | 2            | 8            | game              | blocks           | Last to not topple       |
| Connect Four                       | 1            | 1            | game              | pieces           | Four in a row            |
| Connect Four (Pop 10)              | 1            | 1            | game              | pieces           | Four in a row            |
| Tic-Tac-Toe                        | 1            | 1            | game              | marks            | Three in a row           |
| Tic-Tac-Toe (3D)                   | 1            | 1            | game              | marks            | Three in a row           |
| Othello/Reversi                    | 1            | 1            | game              | pieces           | Most pieces              |
| Mancala                            | 1            | 1            | game              | seeds            | Most seeds               |
| Mancala (Oware)                    | 1            | 1            | game              | seeds            | Most seeds               |
| Chinese Checkers                   | 2            | 6            | game              | marbles          | First across board       |
| Battleship                         | 1            | 1            | game              | ships            | Sink all ships           |
| Battleship (Salvo)                 | 1            | 1            | game              | ships            | Sink all ships           |
| Twister                            | 4            | 4            | game              | positions        | Last standing            |
| King of the Hill                   | 3            | 20           | game              | position         | Control high ground      |
| Capture the Flag                   | 6            | 50           | game              | flags            | Capture opponent flag    |
| Capture the Flag (Jail)            | 8            | 50           | game              | flags            | Capture opponent flag    |
| Tag                                | 3            | 30           | game              | tagged           | Avoid being tagged       |
| Tag (Freeze)                       | 5            | 30           | game              | tagged           | Avoid being frozen       |
| Tag (TV)                           | 5            | 20           | game              | tagged           | Avoid being tagged       |
| Hide and Seek                      | 3            | 20           | round             | hidden           | Stay hidden longest      |
| Hide and Seek (Sardines)           | 6            | 20           | round             | hidden           | Find and join hider      |
| Red Rover                          | 10           | 30           | game              | breaks           | Break through chain      |
| Tug of War                         | 4            | 20           | game              | position         | Pull opponents over      |
| Duck Duck Goose                    | 6            | 30           | round             | laps             | Avoid being caught       |
| Musical Chairs                     | 3            | 20           | round             | chairs           | Last seated              |
| Musical Chairs (Cooperative)       | 3            | 20           | round             | chairs           | Everyone finds space     |
| Arm Wrestling                      | 1            | 1            | match             | position         | Pin opponent's arm       |.