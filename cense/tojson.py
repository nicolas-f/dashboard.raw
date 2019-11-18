import json
data = """p0010	61	B8:27:EB:AC:25:1A	2	2348	1FRDES 1		1	2512	C13	47.75411	-3.36619			4 m	4 m	
p0020	5	B8:27:EB:9A:AD:BD	1	2349	1FRDES 3		1	2512	C13	47.75384	-3.36609			4 m	4 m	
p0030	4	B8:27:EB:AD:FD:10	1	2347	1FRDES 5		1	2512	C13	47.75344	-3.3659			4 m	4 m	
p0040	13	B8:27:EB:7C:F7:6A		2336	1FRDES 7		1	2512	C13	47.75325	-3.36582			4 m	4 m	
p0050	71	B8:27:EB:40:D7:0D		2338	1FRDES 9		1	2512	C13	47.75301	-3.36574			4 m	4 m	
p0060	39	B8:27:EB:13:87:B9		2337	1FRDES 11		1	2512	C13	47.75264	-3.3656			4 m	4 m	
p0070	36	B8:27:EB:7B:27:BF	2	2340	1FRDES 13		1	2512	C13	47.75226	-3.36546			4 m	4 m	
p0080	80	B8:27:EB:42:3D:54	1	2323	1EAUC 12		1	2512	C13	47.75345	-3.36679				4 m	Candélabre défectueux. Non alimenté.Voir avec Ville de Lorient (PAS DE CLASSE II)
p0090	67	B8:27:EB:D7:55:57		2322	1EAUC 10		1	2512	C13	47.75333	-3.36718				4 m	(PAS DE CLASSE II)
p0100	26	B8:27:EB:35:DF:3A		2331	1EAUC 8		1	2512	C13	47.75291	-3.36786				4 m	Porte fusible changé (PAS DE CLASSE II)
p0110	53	B8:27:EB:6D:68:D1	1	2332	1EAUC 6		1	2512	C13	47.75259	-3.36827				4 m	(PAS DE CLASSE II)
p0120	64	B8:27:EB:DE:88:CD	1	2333	1EAUC 4		1	2512	C13	47.75226	-3.36867				4 m	(PAS DE CLASSE II)
p0130	32	B8:27:EB:95:C7:CD	2	2334	1EAUC 2		1	2512	C13	47.75182	-3.36921				4 m	(PAS DE CLASSE II)
p0140	52	B8:27:EB:4B:7B:9C	1	2540	1SVOB 9		7	2733	C15	47.75143	-3.36889			4 m	4 m	Mât accidenté
p0150	75	B8:27:EB:EA:12:88		2465	1SVOB 7		7	2733	C15	47.75114	-3.3684			4 m	4 m	Mât accidenté
p0160	49	B8:27:EB:5D:A9:60	1	2466	1SVOB 5		7	2733	C15	47.75078	-3.36774			4 m	4 m	Mât accidenté
p0170	55	B8:27:EB:4E:59:87	2	2716	1LECL 2		8	2912	C16	47.74987	-3.36639			4 m	4 m	
p0180	45	B8:27:EB:77:1C:26		2715	1LECL 4		8	2912	C16	47.74945	-3.36609			4 m	4 m	
p0190	54	B8:27:EB:E1:FB:4F		2714	1LECL 6		8	2912	C16	47.74907	-3.36587				4 m	
p0200	79	B8:27:EB:60:92:E2		2710	1LECL 8A		8	2912	C16	47.74877	-3.36571					
p0210				2739	1WAQU 0			2912	C16	47.7489	-3.36544					Annulé (impossibilité de poser CITBOX dans le mât bois)
p0220	15	B8:27:EB:CC:42:7D		2740	1WAQU 3		8	2912	C16	47.74904	-3.36493			4 m	4 m	
p0230	59	B8:27:EB:C3:D1:E5	1	2741	1WAQU 11		8	2912	C16	47.74914	-3.36452				4 m	
p0240	58	B8:27:EB:A0:F5:4F		2693	1LECL 13		8	2912	C16	47.74851	-3.36539				4 m	
p0250	68	B8:27:EB:EA:EB:EA		2694	1LECL 15		8	2912	C16	47.74832	-3.36526			4 m		
p0260	25	B8:27:EB:52:F4:03		2692	1LECL 17		8	2912	C16	47.74806	-3.3651			4 m	4 m	
p0270	38	B8:27:EB:74:92:77	1	2691	1LECL 19		8	2912	C16	47.7479	-3.36495				4 m	
p0280	42	B8:27:EB:1F:AB:9F	1	2678	1FAO 1		8	2912	C16	47.74782	-3.36477				4 m	
p0290	57	B8:27:EB:4D:21:0D		3264	non communiqué		4	3481	Ferry	47.74743	-3.36429				4 m	CITYBOX 29
p0300	62	B8:27:EB:A9:7C:AC	1	3209	non communiqué		4	3481	Ferry	47.74718	-3.36378				4 m	CITYBOX ? Caméra sur mât
p0310	41	B8:27:EB:22:08:E9	1	3193	non communiqué		4	3481	Ferry	47.74688	-3.36295				4 m	CITYBOX 25
p0320	2	B8:27:EB:49:EE:33		3195	non communiqué		4	3481	Ferry	47.74668	-3.36244				4 m	CITYBOX 24
p0330	60	B8:27:EB:EE:CC:15		3188	non communiqué		4	3481	Ferry	47.74639	-3.36176				4 m	CITYBOX 23
p0340	65	B8:27:EB:E8:E1:CD		Information inconnue	non communiqué		4	3481	Ferry	47.7463	-3.36144				4 m	CITYBOX 21
p0350	14	B8:27:EB:B1:CE:D8	1	3181	non communiqué		4	3481	Ferry	47.74606	-3.361				4 m	CITYBOX 18
p0360	18	B8:27:EB:63:C0:D3	1	3179	non communiqué		4	3481	Ferry	47.74596	-3.3606				4 m	CITYBOX 19
p0370	16	B8:27:EB:D8:7C:A3		3360	non communiqué		4	non communiqué	Ferry	47.74586	-3.36333				4 m	CITYBOX 5
p0380	43	B8:27:EB:8A:11:13		Information inconnue	non communiqué		4	non communiqué	Ferry	47.74604	-3.36378					
p0390	22	B8:27:EB:C8:21:C1		Information inconnue	non communiqué		4	non communiqué	Ferry	47.74644	-3.36473				4 m	CITYBOX ? Non raccordé (Porte fusible ouvert cramé)
p0400	35	B8:27:EB:1A:0B:6C		Information inconnue	non communiqué		4	non communiqué	Ferry	47.7468	-3.36572				4 m	CITYBOX 11
p0410	69	B8:27:EB:22:C0:63		2832	2BRIA 19A		10	2997	Comédie	47.74857	-3.36417				4 m	
p0420	11	B8:27:EB:9A:BA:D5	1	2834	2BRIA 18A		10	2997	Comédie	47.74849	-3.36397				4 m	
p0430	29	B8:27:EB:7B:E0:EE	1	2836	2BRIA 17A		10	2997	Comédie	47.74839	-3.36379				4 m	
p0440	44	B8:27:EB:5C:5D:C0	1	2830	2BRIA 16A		10	2997	Comédie	47.74832	-3.36363		 		4 m	
p0450	46	B8:27:EB:15:B8:0D		2863	1ASNA 13		10	2997	Comédie	47.74841	-3.3633			2,50 m	3,50 m	Classe II en mauvais état
p0460	72	B8:27:EB:A8:79:B3		2842	1ASNA 9		10	2997	Comédie	47.74868	-3.36306			2,50 m	3,50 m	
p0470	3	B8:27:EB:8E:7D:C7		2843	1ASNA 5		10	2997	Comédie	47.749	-3.36282			2,50 m	3,50 m	
p0480	28	B8:27:EB:BF:A4:63	1	2844	1ASNA 1		10	2997	Comédie	47.74932	-3.36261			2,50 m	3,50 m	
p0490	74	B8:27:EB:4B:F1:E1	1	2661	1VIMA 21		9	2893	C60	47.75061	-3.36161			2,50 m	4 m	
p0500	63	B8:27:EB:03:5C:6B	1	2659	1VIMA 23A		9	2893	C60	47.75098	-3.36142			2,50 m	4 m	
p0510	34	B8:27:EB:67:E2:23		2657	1VIMA 25		9	2893	C60	47.75126	-3.36134			2,50 m	4 m	
p0520			1	2655	2CLEM 2			2893		47.75171	-3.36126					Annulé (impossibilité de poser CITBOX dans le mât)
p0530	51	B8:27:EB:C1:99:1C	2	2494	1DUCO 26		5	2786	CLISSON	47.75065	-3.36297				4 m	
p0540	21	B8:27:EB:19:83:F0	1	2499	1CLIS 5		5	2786	CLISSON	47.75084	-3.36348				4 m	
p0550	40	B8:27:EB:20:53:54		2496	1DUCO 32		5	2786	CLISSON	47.7513	-3.36263				4 m	
p0560	81	B8:27:EB:42:3D:54	1	2598	162RI 35		5	2786	CLISSON	47.75158	-3.36266				4 m	
p0570	20	B8:27:EB:47:37:3F		2400	1CHAZ 65		6	2601	61 RI	47.75214	-3.36147				4 m	
p0580	33	B8:27:EB:28:52:82		2403	1CHAZ 63		6	2601	61 RI	47.75245	-3.3617					
p0590	78	B8:27:EB:15:F9:77	1	2402	1CHAZ 59		6	2601	61 RI	47.7527	-3.36197					
p0600	47	B8:27:EB:F6:7B:4B	1	2401	1CHAZ 61		6	2601	61 RI	47.75273	-3.36186				4 m	
p0610	37	B8:27:EB:CE:2E:F8		2378	1CHAZ 57		6	2601	61 RI	47.75306	-3.36208				4 m	
p0620	70	B8:27:EB:C3:B9:27		2379	1CHAZ 51		6	2601	61 RI	47.7534	-3.36233				4 m	Pas de classe II
p0630	10	B8:27:EB:EB:D9:4D	1	2376	1CHAZ 47		6	2601	61 RI	47.75374	-3.36254				4 m	
p0640	24	B8:27:EB:31:15:1A	1	2377	1CHAZ 43		6	2601	61 RI	47.75406	-3.36276				4 m	Pas de classe II
p0650	73	B8:27:EB:19:7E:22	1	2380	1CHAZ 39		6	2601	61 RI	47.75442	-3.36301				4 m	Pas de classe II
p0660	50	B8:27:EB:45:F3:26	1	2381	1CHAZ 35		6	2601	61 RI	47.75473	-3.36321				4 m	Pas de classe II
p0670	9	B8:27:EB:20:DA:A9	2	2229	1CHAI 13	7903	3	2287	C62	47.75488	-3.35946			0,50 m	4 m	Pose d'un contacteur
p0680	31	B8:27:EB:B3:D0:82		7905	1CHAI 17		3	2663	C62	47.75508	-3.35883			0,50 m	4 m	
p0690	27	B8:27:EB:56:87:4E		7908	1CHAI 21		3	2663	C62	47.75557	-3.3581			0,50 m	4 m	
p0700	30	B8:27:EB:11:D0:A3		7910	1CHAI 25		3	2663	C62	47.75604	-3.35738			1 m	4 m	
p0710			2	1889	1VIBO 10		2	2030	poterie	47.75786	-3.35888					Annulé (impossibilité de poser CITBOX sur le poteau béton)
p0720	76	B8:27:EB:3B:82:1C	1	1877	2POTE 1		2	2030	poterie	47.75771	-3.3571				4 m	
p0730	77	B8:27:EB:E3:3F:83	1	1875	1LAEN 3		2	2030	poterie	47.75754	-3.35565				4 m	
p0740	8	B8:27:EB:13:A8:0F		1874	1LAEN 7		2	2030	poterie	47.75794	-3.35639				4 m	
p0750	23	B8:27:EB:38:BB:11		1871	1LAEN 11		2	2030	poterie	47.75832	-3.35732				4 m	
p0760	48	B8:27:EB:73:9E:B6		1867	1LAEN 15		2	2030	poterie	47.75848	-3.35833				4 m	
p0770	66	B8:27:EB:99:8A:A9			1LAEN 21	1868	2	2030	poterie	47.75844	-3.35933				4 m	
p0780				Information inconnue	Information inconnue			non communiqué		47.74398	-3.35072					
"""
jsondata = []
for row in data.split("\n"):
    columns = row.split("\t")
    if len(columns) >= 16 and columns[1].strip() != "":
        sensor = {}
        sensor["map_id_sensor"] = columns[0]
        sensor["box_id_sensor"] = int(columns[1])
        sensor["mac"] = columns[2]
        sensor["esid"] = "urn:osh:sensor:noisemonitoring:" + columns[2].replace(":", "-")
        sensor["connected_radio_count"] = int(columns[3]) if columns[3] != "" else 0
        sensor["lorient1_id_sensor"] = columns[4]
        sensor["lorient2_id_sensor"] = columns[5]
        sensor["4g_router_id"] = columns[7]
        sensor["map_cabinet_id"] = columns[8]
        sensor["light_cabinet_id"] = columns[9]
        sensor["lat"] = float(columns[10])
        sensor["long"] = float(columns[11])
        sensor["height"] = float(columns[15][:columns[15].find(" m")].replace(",", ".")) if "m" in columns[15] else 0
        jsondata.append(sensor)

print(json.dumps(jsondata, indent=4))