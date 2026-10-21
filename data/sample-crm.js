/* Sample CRM enquiries (fictional people & numbers). Dates are relative to "now" so the dashboard always looks alive. */
window.makeSampleLeads=function(cars){
  const day=86400000,now=Date.now(),iso=d=>new Date(now-d*day).toISOString(),fu=d=>new Date(now+d*day).toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});
  const pick=i=>cars.length?cars[i%cars.length]:{id:"",title:""};
  const L=[
   ["Rohit Sharma","9810000011","Buy",0,"Is this still available? Can I see it this weekend?",350000,"Website","New","Hot",0,0.1,""],
   ["Priya Verma","9810000012","Test drive",1,"Want a test drive on Saturday after 12.",550000,"Website","Visit scheduled","Hot",1,0.5,"Coming Saturday 1 PM with husband."],
   ["Amit Khanna","9810000013","Finance",5,"What will be the EMI with 20% down payment?",600000,"Website","Contacted","Hot",0,1,"Sent EMI sheet on WhatsApp. Waiting for salary slips."],
   ["Sunita Devi","9810000014","Buy",3,"Please share more photos of the interior.",260000,"WhatsApp","Contacted","Warm",2,2,""],
   ["Vikas Gupta","9810000015","Sell",null,"Selling Swift VXi 2017, 48,000 km, DL registration. Expected 4.2 lakh.",420000,"Website","New","Warm",0,0.2,""],
   ["Neha Singh","9810000016","Buy",6,"Is the price negotiable?",300000,"CarWale","Negotiation","Hot",1,3,"Offered 2.85L. Customer wants 2.75L."],
   ["Manish Tyagi","9810000017","Callback",null,"Please call me back regarding a budget hatchback.",300000,"Website","New","Warm",0,0.05,""],
   ["Deepak Yadav","9810000018","Buy",7,"Interested. Do you accept exchange of my i10?",340000,"CarTrade","Contacted","Warm",3,4,"Exchange car i10 2012, valuation pending."],
   ["Kavita Joshi","9810000019","Buy",2,"Looking for first car for my daughter.",230000,"Walk-in","Won","Hot",null,9,"Sold. Booking amount 20k received."],
   ["Sanjay Mishra","9810000020","Buy",8,"Need a CNG car. Do you have papers clear?",270000,"Website","Lost","Cold",null,12,"Bought elsewhere."],
   ["Pooja Arora","9810000021","Sell",null,"Honda City 2016 petrol, 71,000 km, UP16. Want quick sale.",480000,"Website","Visit scheduled","Hot",1,2,"Inspection Tuesday 11 AM at showroom."],
   ["Rahul Bansal","9810000022","Finance",10,"Can I get 80% loan on this car?",500000,"Website","Contacted","Warm",2,5,""],
   ["Anjali Mehta","9810000023","Test drive",11,"Can I come tomorrow evening?",570000,"Instagram","New","Hot",0,0.3,""],
   ["Mohd. Imran","9810000024","Buy",4,"Final price for Freestyle in cash?",310000,"Walk-in","Negotiation","Hot",1,6,"Cash buyer. Meeting at showroom Friday."],
   ["Shweta Kapoor","9810000025","Other",null,"Do you do insurance renewal for cars not bought from you?",0,"Website","Contacted","Cold",null,8,""],
   ["Gaurav Malik","9810000026","Buy",9,"Is this single owner? Service records available?",270000,"WhatsApp","Won","Warm",null,15,"Delivered. Asked for Google review."],
   ["Ritu Saxena","9810000027","Buy",0,"Can you reduce price by 10k?",300000,"Website","Lost","Cold",null,20,"Budget too low."],
   ["Harish Chand","9810000028","Sell",null,"Maruti Alto K10 2019, 30,000 km. Price expectation 2.6 lakh.",260000,"Walk-in","Contacted","Warm",4,7,"Quote given 2.45L. Thinking."]
  ];
  const TL=["Immediately","This month","1-3 months","Just exploring"],PT=["Morning","Afternoon","Evening","Anytime"],LR={Lost:["Bought elsewhere","Budget too low","Not interested"]},LRI={"Sanjay Mishra":"Bought elsewhere","Ritu Saxena":"Budget too low"};
  return L.map((r,i)=>{const c=r[3]===null?{id:"",title:""}:pick(r[3]),t=r[10],h=[{t:iso(t),u:"website",x:r[2]+" enquiry received via "+r[6]}];
    if(r[7]!=="New"){h.push({t:iso(t-0.08),u:"admin",x:"Contacted: WhatsApp"},{t:iso(t-0.1),u:"admin",x:"Status: New → "+r[7]})}
    if(r[11])h.push({t:iso(t-0.15),u:"admin",x:"Note: "+r[11]});
    return{id:"LS"+(i+1),time:iso(t),name:r[0],phone:r[1],email:"",type:r[2],carId:c.id,carTitle:c.title,budget:r[5],message:r[4],source:r[6],status:r[7],priority:r[8],followUp:r[9]===null?"":fu(r[9]),notes:r[11],updated:iso(Math.max(0,t-0.2)),timeline:TL[i%4],preferredTime:PT[i%4],lostReason:r[7]==="Lost"?(LRI[r[0]]||"Not interested"):"",lastContact:r[7]==="New"?"":iso(t-0.08),repeat:i===2||i===13?1:0,history:h}});
};
