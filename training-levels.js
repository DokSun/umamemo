'use strict';
// Pure calculator: only completed turns count. Turn 1 begins with every level at 1.
const TrainingLevels=(()=>{
 const TYPES=[
  ['speed','스피드'],['stamina','스태미나'],['power','파워'],
  ['guts','근성'],['wisdom','지능']
 ];
 function isSummerCamp(turn){
  if(turn<1||turn>72)return false;
  const year=Math.floor((turn-1)/24);
  const month=Math.floor(((turn-1)%24)/2)+1;
  return year>0&&(month===7||month===8);
 }
 function calculate(schedule,completedTurns=0){
  const completed=Math.max(0,Math.min(72,Math.trunc(Number(completedTurns)||0)));
  const nextTurn=completed<72?completed+1:72;
  const summerCamp=completed<72&&isSummerCamp(nextTurn);
  // Year transition occurs before classic turn 25 and senior turn 49.
  const yearBoost=(completed>=24?1:0)+(completed>=48?1:0);
  const counts=Object.fromEntries(TYPES.map(([type])=>[type,0]));
  for(let turn=1;turn<=completed;turn++){
   if(isSummerCamp(turn))continue; // summer camp never contributes to training level
   const year=['junior','classic','senior'][Math.floor((turn-1)/24)];
   const action=schedule?.turns?.[year]?.[(turn-1)%24];
   if(Object.hasOwn(counts,action))counts[action]++;
  }
  return {
   completed,nextTurn,summerCamp,yearBoost,
   levels:TYPES.map(([type,label])=>{
    const count=counts[type];
    const baseLevel=Math.min(5,1+yearBoost+Math.floor(count/4));
    return {type,label,count,baseLevel,level:summerCamp?5:baseLevel,untilNext:baseLevel===5?0:4-count%4};
   })
  };
 }
 return Object.freeze({TYPES,isSummerCamp,calculate});
})();